-- Create product_variations table
CREATE TABLE IF NOT EXISTS public.product_variations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id TEXT REFERENCES public.products(id) ON DELETE CASCADE,
    name TEXT NOT NULL, -- e.g., "128GB / UK Used"
    price_numeric BIGINT NOT NULL,
    stock_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.product_variations ENABLE ROW LEVEL SECURITY;

-- Allow public read
CREATE POLICY "Allow public read variations" ON public.product_variations
    FOR SELECT USING (true);

-- Insert variations for the existing iPhone 15 Pro Max
INSERT INTO public.product_variations (product_id, name, price_numeric, stock_count)
VALUES 
    ('iphone-15-pro-max', '256GB / UK Used', 1250000, 5),
    ('iphone-15-pro-max', '512GB / UK Used', 1450000, 3),
    ('iphone-15-pro-max', '256GB / Brand New', 1650000, 2);
