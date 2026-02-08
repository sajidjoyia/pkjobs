-- Create service_categories table for admin-managed work request options
CREATE TABLE public.service_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT,
  default_fee NUMERIC DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.service_categories ENABLE ROW LEVEL SECURITY;

-- Policies for service_categories
CREATE POLICY "Anyone can view active service categories"
  ON public.service_categories FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage service categories"
  ON public.service_categories FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Create work_requests table (separate from job applications but follows same flow)
CREATE TABLE public.work_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  category_id UUID REFERENCES public.service_categories(id),
  custom_description TEXT NOT NULL,
  status application_status NOT NULL DEFAULT 'pending',
  expert_id UUID,
  payment_amount NUMERIC,
  payment_date TIMESTAMP WITH TIME ZONE,
  receipt_url TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.work_requests ENABLE ROW LEVEL SECURITY;

-- Policies for work_requests (same as applications)
CREATE POLICY "Users can view their own work requests"
  ON public.work_requests FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own work requests"
  ON public.work_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own work requests"
  ON public.work_requests FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all work requests"
  ON public.work_requests FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Experts can view assigned work requests"
  ON public.work_requests FOR SELECT
  USING (auth.uid() = expert_id);

CREATE POLICY "Experts can update assigned work requests"
  ON public.work_requests FOR UPDATE
  USING (auth.uid() = expert_id);

-- Updated_at trigger for work_requests
CREATE TRIGGER update_work_requests_updated_at
  BEFORE UPDATE ON public.work_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for work_requests
ALTER PUBLICATION supabase_realtime ADD TABLE public.work_requests;

-- Update conversations table to support work_request_id
ALTER TABLE public.conversations ADD COLUMN work_request_id UUID REFERENCES public.work_requests(id);

-- Insert some default service categories
INSERT INTO public.service_categories (name, display_name, description, default_fee) VALUES
  ('visa_application', 'Visa Application', 'Assistance with visa applications for various countries', 5000),
  ('admission_application', 'Admission Application', 'Help with university or college admissions', 3000),
  ('document_attestation', 'Document Attestation', 'Document verification and attestation services', 2000),
  ('passport_services', 'Passport Services', 'New passport or passport renewal assistance', 2500),
  ('other', 'Other Services', 'Custom service requests', 0);

-- Create notification trigger for work request status updates
CREATE OR REPLACE FUNCTION public.notify_on_work_request_update()
RETURNS TRIGGER AS $$
DECLARE
  category_name TEXT;
  status_text TEXT;
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    SELECT display_name INTO category_name FROM public.service_categories WHERE id = NEW.category_id;
    
    status_text := CASE NEW.status
      WHEN 'payment_received' THEN 'Payment received'
      WHEN 'expert_assigned' THEN 'Expert assigned to your request'
      WHEN 'in_progress' THEN 'Request is in progress'
      WHEN 'applied' THEN 'Request submitted successfully'
      WHEN 'completed' THEN 'Request completed'
      ELSE NEW.status::text
    END;
    
    INSERT INTO public.notifications (user_id, type, title, message, reference_id, reference_type)
    VALUES (
      NEW.user_id,
      'work_request_update',
      'Work Request Update',
      COALESCE(category_name, 'Service') || ': ' || status_text,
      NEW.id,
      'work_request'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_notify_work_request_update
  AFTER UPDATE ON public.work_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_work_request_update();