-- ==========================================================================
-- Catatan App — Initial Database Schema
-- Migration: 00001_initial_schema
-- ==========================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ==========================================================================
-- 1. PROFILES — extends auth.users
-- ==========================================================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'free' CHECK (role IN ('free', 'pro', 'admin')),
  subscription_status TEXT NOT NULL DEFAULT 'none' CHECK (subscription_status IN ('none', 'trial', 'active', 'past_due', 'canceled', 'expired')),
  subscription_plan TEXT CHECK (subscription_plan IN ('monthly', 'yearly')),
  trial_started_at TIMESTAMPTZ,
  trial_ends_at TIMESTAMPTZ,
  payment_provider TEXT,
  payment_customer_id TEXT,
  notes_count INTEGER NOT NULL DEFAULT 0,
  tags_count INTEGER NOT NULL DEFAULT 0,
  storage_used_bytes BIGINT NOT NULL DEFAULT 0,
  theme_preference TEXT NOT NULL DEFAULT 'system' CHECK (theme_preference IN ('light', 'dark', 'system')),
  font_pair TEXT NOT NULL DEFAULT 'default',
  accent_color TEXT NOT NULL DEFAULT '#C4785B',
  onboarding_completed BOOLEAN NOT NULL DEFAULT false,
  last_active_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==========================================================================
-- 2. WAITLIST — pre-launch email collection
-- ==========================================================================
CREATE TABLE waitlist (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL UNIQUE,
  referral_source TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==========================================================================
-- 3. NOTES — core notes table
-- ==========================================================================
CREATE TABLE notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Untitled',
  content JSONB NOT NULL DEFAULT '{"type":"doc","content":[]}',
  content_text TEXT NOT NULL DEFAULT '',
  word_count INTEGER NOT NULL DEFAULT 0,
  reading_time_minutes INTEGER NOT NULL DEFAULT 0,
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  is_archived BOOLEAN NOT NULL DEFAULT false,
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  deleted_at TIMESTAMPTZ,
  last_edited_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_synced_at TIMESTAMPTZ,
  local_version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==========================================================================
-- 4. TAGS — user tags
-- ==========================================================================
CREATE TABLE tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#C4785B',
  notes_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, name)
);

-- ==========================================================================
-- 5. NOTE_TAGS — junction table
-- ==========================================================================
CREATE TABLE note_tags (
  note_id UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (note_id, tag_id)
);

-- ==========================================================================
-- 6. IMAGES — image metadata (Pro only)
-- ==========================================================================
CREATE TABLE images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  note_id UUID REFERENCES notes(id) ON DELETE SET NULL,
  storage_path TEXT NOT NULL,
  public_url TEXT NOT NULL,
  filename TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes BIGINT NOT NULL DEFAULT 0,
  width INTEGER,
  height INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==========================================================================
-- 7. SUBSCRIPTIONS — subscription history
-- ==========================================================================
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  plan TEXT NOT NULL CHECK (plan IN ('monthly', 'yearly')),
  status TEXT NOT NULL CHECK (status IN ('trial', 'active', 'past_due', 'canceled', 'expired')),
  amount INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'IDR',
  payment_provider TEXT NOT NULL,
  payment_external_id TEXT,
  payment_method TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  canceled_at TIMESTAMPTZ,
  cancel_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==========================================================================
-- 8. PAYMENT_EVENTS — webhook audit trail (immutable)
-- ==========================================================================
CREATE TABLE payment_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  event_type TEXT NOT NULL,
  external_id TEXT,
  payload JSONB NOT NULL DEFAULT '{}',
  processed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==========================================================================
-- 9. PLATFORM_CONFIG — global key-value config
-- ==========================================================================
CREATE TABLE platform_config (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES profiles(id) ON DELETE SET NULL
);

-- ==========================================================================
-- 10. ADMIN_AUDIT_LOG — admin action log
-- ==========================================================================
CREATE TABLE admin_audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  target_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  details JSONB DEFAULT '{}',
  ip_address INET,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==========================================================================
-- INDEXES
-- ==========================================================================

-- Profiles
CREATE UNIQUE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_subscription_status ON profiles(subscription_status);

-- Notes
CREATE INDEX idx_notes_user_id ON notes(user_id);
CREATE INDEX idx_notes_user_last_edited ON notes(user_id, last_edited_at DESC);
CREATE INDEX idx_notes_user_deleted ON notes(user_id) WHERE is_deleted = false;
CREATE INDEX idx_notes_content_text_search ON notes USING gin(content_text gin_trgm_ops);

-- Tags
CREATE INDEX idx_tags_user_id ON tags(user_id);

-- Note_tags
CREATE INDEX idx_note_tags_tag_id ON note_tags(tag_id);

-- Images
CREATE INDEX idx_images_user_id ON images(user_id);
CREATE INDEX idx_images_note_id ON images(note_id);

-- Subscriptions
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_expires_at ON subscriptions(expires_at);

-- Payment events
CREATE INDEX idx_payment_events_user_id ON payment_events(user_id);
CREATE INDEX idx_payment_events_subscription_id ON payment_events(subscription_id);

-- ==========================================================================
-- ROW LEVEL SECURITY
-- ==========================================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE note_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE images ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;

-- Helper function: check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- PROFILES policies
CREATE POLICY "Users can read own profile" ON profiles
  FOR SELECT USING (id = auth.uid());
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (id = auth.uid());
CREATE POLICY "Admins can read all profiles" ON profiles
  FOR SELECT USING (is_admin());
CREATE POLICY "Admins can update all profiles" ON profiles
  FOR UPDATE USING (is_admin());

-- NOTES policies
CREATE POLICY "Users can CRUD own notes" ON notes
  FOR ALL USING (user_id = auth.uid());

-- TAGS policies
CREATE POLICY "Users can CRUD own tags" ON tags
  FOR ALL USING (user_id = auth.uid());

-- NOTE_TAGS policies
CREATE POLICY "Users can CRUD own note_tags" ON note_tags
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM notes WHERE notes.id = note_tags.note_id AND notes.user_id = auth.uid()
    )
  );

-- IMAGES policies
CREATE POLICY "Users can CRUD own images" ON images
  FOR ALL USING (user_id = auth.uid());

-- SUBSCRIPTIONS policies
CREATE POLICY "Users can read own subscriptions" ON subscriptions
  FOR SELECT USING (user_id = auth.uid());

-- PAYMENT_EVENTS policies
CREATE POLICY "Users can read own payment events" ON payment_events
  FOR SELECT USING (user_id = auth.uid());

-- PLATFORM_CONFIG policies
CREATE POLICY "Anyone can read platform config" ON platform_config
  FOR SELECT USING (true);
CREATE POLICY "Admins can manage platform config" ON platform_config
  FOR ALL USING (is_admin());

-- ADMIN_AUDIT_LOG policies
CREATE POLICY "Admins can read audit log" ON admin_audit_log
  FOR SELECT USING (is_admin());
CREATE POLICY "Admins can insert audit log" ON admin_audit_log
  FOR INSERT WITH CHECK (is_admin());

-- ==========================================================================
-- TRIGGERS
-- ==========================================================================

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, role, subscription_status)
  VALUES (NEW.id, NEW.email, 'free', 'none');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at_profiles
  BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at_notes
  BEFORE UPDATE ON notes FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at_tags
  BEFORE UPDATE ON tags FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at_subscriptions
  BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ==========================================================================
-- SEED: Default Platform Config
-- ==========================================================================
INSERT INTO platform_config (key, value, description) VALUES
  ('free_notes_limit', '50', 'Maximum notes for free tier'),
  ('free_tags_limit', '10', 'Maximum tags for free tier'),
  ('pro_storage_limit_bytes', '2147483648', 'Pro tier storage limit (2GB)'),
  ('pro_monthly_price_idr', '39000', 'Pro monthly price in IDR'),
  ('pro_yearly_price_idr', '349000', 'Pro yearly price in IDR'),
  ('trial_duration_days', '7', 'Free trial duration in days'),
  ('soft_delete_purge_days', '30', 'Days before permanently purging soft-deleted notes'),
  ('maintenance_mode', 'false', 'Enable/disable maintenance mode'),
  ('announcement_banner', 'null', 'Global announcement banner text');
