-- Drop the overly permissive service role policy
DROP POLICY IF EXISTS "Service role can manage subscriptions" ON public.subscribers;

-- Create more restrictive policies for service role operations

-- Policy 1: Allow service role to find subscribers by email or polar_customer_id (for webhook processing)
CREATE POLICY "Service role can find subscribers by identifier" ON public.subscribers
FOR SELECT 
TO service_role
USING (
  email IS NOT NULL OR polar_customer_id IS NOT NULL
);

-- Policy 2: Allow service role to update subscriber data (for webhook and portal operations)
CREATE POLICY "Service role can update subscriber data" ON public.subscribers
FOR UPDATE 
TO service_role
USING (
  -- Can update if we have a valid identifier (email or polar_customer_id)
  email IS NOT NULL OR polar_customer_id IS NOT NULL
)
WITH CHECK (
  -- Ensure we're not removing essential identifiers during update
  email IS NOT NULL OR polar_customer_id IS NOT NULL
);

-- Policy 3: Allow service role to create new subscribers (for webhook and portal operations)
CREATE POLICY "Service role can create subscribers" ON public.subscribers
FOR INSERT 
TO service_role
WITH CHECK (
  -- Must have at least an email when creating
  email IS NOT NULL
);

-- Note: DELETE is intentionally not allowed for service role to prevent accidental data loss