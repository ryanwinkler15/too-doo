-- Update auth settings for redirects
ALTER TABLE auth.config
SET site_url = 'https://too-doo-grodt.vercel.app',
    additional_redirect_urls = ARRAY['https://too-doo-grodt.vercel.app'];
