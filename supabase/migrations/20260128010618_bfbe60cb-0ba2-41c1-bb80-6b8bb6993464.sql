-- Create notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL, -- 'message', 'application_update', 'job_update'
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  reference_id UUID, -- can reference conversation_id, application_id, etc.
  reference_type TEXT, -- 'conversation', 'application', 'job'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can view their own notifications
CREATE POLICY "Users can view their own notifications"
ON public.notifications
FOR SELECT
USING (auth.uid() = user_id);

-- Users can update (mark as read) their own notifications
CREATE POLICY "Users can update their own notifications"
ON public.notifications
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own notifications
CREATE POLICY "Users can delete their own notifications"
ON public.notifications
FOR DELETE
USING (auth.uid() = user_id);

-- System/admins can insert notifications for any user
CREATE POLICY "Admins can insert notifications"
ON public.notifications
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR auth.uid() = user_id);

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Create function to create notification when message is sent
CREATE OR REPLACE FUNCTION public.notify_on_new_message()
RETURNS TRIGGER AS $$
DECLARE
  conv_record RECORD;
  recipient_id UUID;
  sender_name TEXT;
BEGIN
  -- Get conversation details
  SELECT * INTO conv_record FROM public.conversations WHERE id = NEW.conversation_id;
  
  -- Determine recipient (opposite of sender)
  IF NEW.sender_id = conv_record.user_id THEN
    recipient_id := conv_record.admin_id;
  ELSE
    recipient_id := conv_record.user_id;
  END IF;
  
  -- Only create notification if recipient exists
  IF recipient_id IS NOT NULL THEN
    -- Get sender name
    SELECT full_name INTO sender_name FROM public.profiles WHERE user_id = NEW.sender_id;
    
    INSERT INTO public.notifications (user_id, type, title, message, reference_id, reference_type)
    VALUES (
      recipient_id,
      'message',
      'New Message',
      COALESCE(sender_name, 'Someone') || ' sent you a message',
      NEW.conversation_id,
      'conversation'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for new messages
CREATE TRIGGER on_new_message_notify
AFTER INSERT ON public.messages
FOR EACH ROW
EXECUTE FUNCTION public.notify_on_new_message();

-- Create function to notify on application status change
CREATE OR REPLACE FUNCTION public.notify_on_application_update()
RETURNS TRIGGER AS $$
DECLARE
  job_title TEXT;
  status_text TEXT;
BEGIN
  -- Only notify if status changed
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    -- Get job title
    SELECT title INTO job_title FROM public.jobs WHERE id = NEW.job_id;
    
    -- Create readable status text
    status_text := CASE NEW.status
      WHEN 'payment_received' THEN 'Payment received'
      WHEN 'expert_assigned' THEN 'Expert assigned to your application'
      WHEN 'in_progress' THEN 'Application is in progress'
      WHEN 'applied' THEN 'Application submitted successfully'
      WHEN 'completed' THEN 'Application completed'
      ELSE NEW.status::text
    END;
    
    INSERT INTO public.notifications (user_id, type, title, message, reference_id, reference_type)
    VALUES (
      NEW.user_id,
      'application_update',
      'Application Update',
      COALESCE(job_title, 'Job') || ': ' || status_text,
      NEW.id,
      'application'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for application updates
CREATE TRIGGER on_application_update_notify
AFTER UPDATE ON public.applications
FOR EACH ROW
EXECUTE FUNCTION public.notify_on_application_update();