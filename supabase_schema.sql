-- ============================================
-- SUPABASE SCHEMA FOR GOAL TRACKER
-- Run this in your Supabase SQL Editor
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLE: users (Extends auth.users)
-- ============================================
CREATE TABLE public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT DEFAULT 'employee' CHECK (role IN ('employee', 'manager', 'admin')),
  department TEXT,
  manager_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLE: thrust_areas
-- ============================================
CREATE TABLE public.thrust_areas (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL
);

-- Insert default thrust areas
INSERT INTO public.thrust_areas (id, name) VALUES
  ('ta1', 'Revenue Growth'),
  ('ta2', 'Customer Satisfaction'),
  ('ta3', 'Operational Excellence'),
  ('ta4', 'Innovation & Learning'),
  ('ta5', 'People Development'),
  ('ta6', 'Cost Optimization');

-- ============================================
-- TABLE: cycles
-- ============================================
CREATE TABLE public.cycles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  phase TEXT DEFAULT 'active' CHECK (phase IN ('active', 'closed'))
);

-- Insert default cycle
INSERT INTO public.cycles (id, name, start_date, end_date, phase) VALUES
  ('cycle-2025', 'FY 2025-26', '2025-05-01', '2026-04-30', 'active');

-- ============================================
-- TABLE: goals
-- ============================================
CREATE TABLE public.goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  cycle_id TEXT NOT NULL REFERENCES public.cycles(id),
  thrust_area_id TEXT NOT NULL REFERENCES public.thrust_areas(id),
  title TEXT NOT NULL,
  description TEXT,
  uom TEXT NOT NULL CHECK (uom IN ('numeric_min', 'numeric_max', 'percent_min', 'percent_max', 'timeline', 'zero')),
  target NUMERIC,
  weight NUMERIC,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'pending_approval', 'approved', 'returned')),
  is_shared BOOLEAN DEFAULT false,
  shared_owner_id UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLE: check_ins
-- ============================================
CREATE TABLE public.check_ins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  goal_id UUID NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,
  quarter TEXT NOT NULL CHECK (quarter IN ('Q1', 'Q2', 'Q3', 'Q4')),
  actual_achievement NUMERIC,
  progress_status TEXT CHECK (progress_status IN ('not_started', 'on_track', 'at_risk', 'completed')),
  manager_comment TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(goal_id, quarter)
);

-- ============================================
-- TABLE: audit_logs
-- ============================================
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  action TEXT NOT NULL,
  field TEXT,
  old_value TEXT,
  new_value TEXT,
  user_id UUID REFERENCES public.users(id),
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ROW LEVEL SECURITY (Optional for now, but recommended)
-- ============================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.thrust_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.check_ins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- VERY PERMISSIVE POLICIES FOR HACKATHON
CREATE POLICY "Enable read access for all users" ON public.users FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON public.thrust_areas FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON public.cycles FOR SELECT USING (true);
CREATE POLICY "Enable all access for authenticated users" ON public.goals FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all access for authenticated users" ON public.check_ins FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all access for authenticated users" ON public.audit_logs FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable update for users on their own row" ON public.users FOR UPDATE USING (auth.uid() = id);

-- TRIGGER FOR UPDATED_AT
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_goals_updated_at BEFORE UPDATE ON public.goals FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_check_ins_updated_at BEFORE UPDATE ON public.check_ins FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Function to handle new user signups and insert into public.users table automatically
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, role)
  VALUES (
    new.id, 
    new.email, 
    COALESCE(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'role', 'employee')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
