interface EditorPageProps {
  params: Promise<{ noteId: string }>;
}

export default async function EditorPage({ params }: EditorPageProps) {
  const { noteId } = await params;

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Editor</h1>
        <p className="mt-2 text-sm opacity-60">Note: {noteId}</p>
        <p className="mt-1 text-xs opacity-40">
          Editor page — built in MAR-7
        </p>
      </div>
    </div>
  );
}
