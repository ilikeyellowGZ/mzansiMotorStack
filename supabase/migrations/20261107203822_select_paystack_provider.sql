update public.pricing_configuration
set payment_provider = 'paystack', updated_at = now()
where singleton;
