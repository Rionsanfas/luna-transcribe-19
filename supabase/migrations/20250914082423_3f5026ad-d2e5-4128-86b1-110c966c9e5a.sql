-- Migrate token-related columns to support fractional tokens (1 decimal)
-- Profiles: token_balance integer -> numeric(10,1)
ALTER TABLE public.profiles
ALTER COLUMN token_balance TYPE numeric(10,1) USING token_balance::numeric,
ALTER COLUMN token_balance SET DEFAULT 0;

-- Video jobs: tokens_used integer -> numeric(10,1)
ALTER TABLE public.video_jobs
ALTER COLUMN tokens_used TYPE numeric(10,1) USING tokens_used::numeric;

-- Token transactions: amount integer -> numeric(10,1)
ALTER TABLE public.token_transactions
ALTER COLUMN amount TYPE numeric(10,1) USING amount::numeric;