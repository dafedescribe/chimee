-- Create products table
CREATE TABLE IF NOT EXISTS public.products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    condition TEXT NOT NULL,
    price_numeric BIGINT NOT NULL,
    stock_count INTEGER NOT NULL DEFAULT 0,
    specs JSONB NOT NULL DEFAULT '[]'::jsonb,
    image_url TEXT NOT NULL,
    description TEXT NOT NULL,
    is_deal BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Set up Row Level Security (RLS)
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public read access
CREATE POLICY "Allow public read access" ON public.products
    FOR SELECT USING (true);

-- Create policy to allow service role write access (used by bot)
-- Note: Service role bypasses RLS by default, but we can be explicit if needed.
