'use client';

import { useRef, useEffect } from 'react';
import {
  tiptapToPlainText,
  tiptapToMarkdown,
  tiptapToHTML,
  downloadFile,
  sanitizeFilename,
  copyToClipboard,
} from '@/lib/export-utils';
import { showToast } from '@/components/ui/toast';

interface ExportMenuProps {
  noteTitle: string;
  noteContent: Record<string, unknown>;
  onClose: () => void;
}

const IS_PRO = false; // TODO: wire to actual subscription state

export function ExportMenu({ noteTitle, noteContent, onClose }: ExportMenuProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [onClose]);

  const handlePlainText = async () => {
    const text = tiptapToPlainText(noteContent);
    const ok = await copyToClipboard(text);
    if (ok) {
      showToast({ message: 'Teks disalin ke clipboard' });
    } else {
      showToast({ message: 'Gagal menyalin teks' });
    }
    onClose();
  };

  const handleMarkdown = () => {
    if (!IS_PRO) {
      showToast({
        message: 'Fitur Pro — upgrade untuk ekspor Markdown',
        action: { label: 'Upgrade', onClick: () => { window.location.href = '/#pricing'; } },
      });
      onClose();
      return;
    }
    const md = tiptapToMarkdown(noteContent);
    const filename = `${sanitizeFilename(noteTitle)}.md`;
    downloadFile(filename, md, 'text/markdown;charset=utf-8');
    showToast({ message: 'File Markdown diunduh' });
    onClose();
  };

  const handleHTML = () => {
    if (!IS_PRO) {
      showToast({
        message: 'Fitur Pro — upgrade untuk ekspor HTML',
        action: { label: 'Upgrade', onClick: () => { window.location.href = '/#pricing'; } },
      });
      onClose();
      return;
    }
    const html = tiptapToHTML(noteContent, noteTitle);
    const filename = `${sanitizeFilename(noteTitle)}.html`;
    downloadFile(filename, html, 'text/html;charset=utf-8');
    showToast({ message: 'File HTML diunduh' });
    onClose();
  };

  const handlePDF = () => {
    if (!IS_PRO) {
      showToast({
        message: 'Fitur Pro — upgrade untuk ekspor PDF',
        action: { label: 'Upgrade', onClick: () => { window.location.href = '/#pricing'; } },
      });
      onClose();
      return;
    }
    // Generate HTML and open in new window for printing as PDF
    const html = tiptapToHTML(noteContent, noteTitle);
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.onload = () => {
        printWindow.print();
      };
    }
    onClose();
  };

  const exportItems = [
    {
      label: 'Salin teks',
      description: 'Teks tanpa format',
      badge: null,
      icon: (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="4.5" y="4.5" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.2"/>
          <path d="M9.5 2.5H2.5C1.94772 2.5 1.5 2.94772 1.5 3.5V10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
        </svg>
      ),
      onClick: handlePlainText,
    },
    {
      label: 'Markdown',
      description: 'File .md',
      badge: !IS_PRO ? 'PRO' : null,
      icon: (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="1" y="3" width="12" height="8" rx="1" stroke="currentColor" strokeWidth="1.2"/>
          <path d="M3 9V5L5 7.5L7 5V9M9.5 5V9L11 7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      onClick: handleMarkdown,
    },
    {
      label: 'HTML',
      description: 'File .html',
      badge: !IS_PRO ? 'PRO' : null,
      icon: (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M4.5 4L1.5 7L4.5 10M9.5 4L12.5 7L9.5 10M8 3L6 11" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      onClick: handleHTML,
    },
    {
      label: 'PDF',
      description: 'Cetak sebagai PDF',
      badge: !IS_PRO ? 'PRO' : null,
      icon: (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M3 1H8.5L11 3.5V13H3V1Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
          <path d="M8.5 1V3.5H11" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
          <path d="M5 7H9M5 9H8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
        </svg>
      ),
      onClick: handlePDF,
    },
  ];

  return (
    <div
      ref={ref}
      className="min-w-[200px] rounded-lg border border-border bg-bg-elevated py-1 shadow-lg"
    >
      <div className="px-3 py-2">
        <span className="text-label font-medium text-text-muted">Ekspor sebagai...</span>
      </div>
      <div className="border-t border-border" />
      {exportItems.map((item, i) => (
        <button
          key={i}
          onClick={item.onClick}
          className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-caption text-text-secondary transition-colors hover:bg-bg-tertiary"
        >
          <span className="shrink-0 text-text-muted">{item.icon}</span>
          <span className="flex-1">
            <span className="font-medium">{item.label}</span>
            <span className="ml-1.5 text-text-muted">{item.description}</span>
          </span>
          {item.badge && (
            <span className="rounded bg-accent/15 px-1.5 py-0.5 text-[10px] font-bold text-accent">
              {item.badge}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
