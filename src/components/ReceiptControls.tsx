import { useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Eye, Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

const BUCKET = "application-receipts";
const PREFIX = "receipt:";
const MAX_BYTES = 10 * 1024 * 1024;

/** Opens a stored receipt. New uploads are `receipt:<path>` and get a 10-minute signed link. */
export const openReceipt = async (stored: string) => {
  if (!stored.startsWith(PREFIX)) {
    window.open(stored, "_blank", "noopener");
    return;
  }
  const win = window.open("", "_blank");
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(stored.slice(PREFIX.length), 600);
  if (error || !data) {
    win?.close();
    toast.error("Could not open the receipt");
    return;
  }
  if (win) win.location.href = data.signedUrl;
  else window.open(data.signedUrl, "_blank");
};

export const ViewReceiptButton = ({ receiptUrl, label = "Receipt" }: { receiptUrl: string; label?: string }) => (
  <Button variant="outline" size="sm" className="gap-2" onClick={() => openReceipt(receiptUrl)}>
    <Eye className="h-4 w-4" /> {label}
  </Button>
);

/** Upload a paid challan / submission receipt (assigned expert or admin only). */
export const UploadReceiptButton = ({
  recordId,
  type,
  hasReceipt,
}: {
  recordId: string;
  type: "application" | "work_request";
  hasReceipt: boolean;
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const qc = useQueryClient();

  const handleFile = async (file: File) => {
    if (file.size > MAX_BYTES) return toast.error("File must be 10 MB or smaller");
    if (!/^(image\/|application\/pdf)/.test(file.type)) return toast.error("Upload an image or PDF");
    setBusy(true);
    try {
      const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const path = `${recordId}/${Date.now()}-${safe}`;
      const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, file, { contentType: file.type });
      if (upErr) throw upErr;
      const table = type === "application" ? "applications" : "work_requests";
      const { error } = await supabase.from(table).update({ receipt_url: PREFIX + path }).eq("id", recordId);
      if (error) throw error;
      toast.success("Receipt uploaded — the applicant can now view it");
      ["expert-assignments", "all-applications", "my-applications", "all-work-requests", "my-work-requests"].forEach((k) =>
        qc.invalidateQueries({ queryKey: [k] })
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*,application/pdf"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
      />
      <Button variant="outline" size="sm" className="gap-2" disabled={busy} onClick={() => inputRef.current?.click()}>
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
        {hasReceipt ? "Replace receipt" : "Upload paid challan / receipt"}
      </Button>
    </>
  );
};
