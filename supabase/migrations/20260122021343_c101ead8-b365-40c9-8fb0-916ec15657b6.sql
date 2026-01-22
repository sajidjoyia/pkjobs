-- Add application_id to conversations table to link chats with specific job applications
ALTER TABLE public.conversations ADD COLUMN application_id uuid REFERENCES public.applications(id);

-- Create index for faster lookups
CREATE INDEX idx_conversations_application_id ON public.conversations(application_id);