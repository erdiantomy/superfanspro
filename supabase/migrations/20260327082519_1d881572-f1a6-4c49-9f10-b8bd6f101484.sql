CREATE POLICY "Admins can delete venues"
ON public.venues
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));