import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	images: {
		// Allow Supabase storage public bucket URLs (and any subdomain of supabase.co if helpful)
		domains: ["adivedepsubrzujktzsi.supabase.co"],
		remotePatterns: [
			{
				protocol: "https",
				hostname: "adivedepsubrzujktzsi.supabase.co",
				port: "",
				pathname: "/storage/v1/**",
			},
		],
	},
};

export default nextConfig;
