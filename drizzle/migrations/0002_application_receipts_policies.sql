CREATE OR REPLACE FUNCTION public.can_access_receipt_folder(_folder text, _write boolean)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_role(auth.uid(),'admin') OR EXISTS (
    SELECT 1 FROM public.applications a WHERE a.id::text = _folder
      AND (a.expert_id = auth.uid() OR (NOT _write AND a.user_id = auth.uid()))
  ) OR EXISTS (
    SELECT 1 FROM public.work_requests w WHERE w.id::text = _folder
      AND (w.expert_id = auth.uid() OR (NOT _write AND w.user_id = auth.uid()))
  )
$$;
REVOKE EXECUTE ON FUNCTION public.can_access_receipt_folder(text, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_access_receipt_folder(text, boolean) TO authenticated;

CREATE POLICY "Receipts readable by owner, expert, admin" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'application-receipts' AND public.can_access_receipt_folder((storage.foldername(name))[1], false));
CREATE POLICY "Receipts uploadable by expert or admin" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'application-receipts' AND public.can_access_receipt_folder((storage.foldername(name))[1], true));
CREATE POLICY "Receipts deletable by expert or admin" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'application-receipts' AND public.can_access_receipt_folder((storage.foldername(name))[1], true));