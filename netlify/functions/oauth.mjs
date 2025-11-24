/**
 * Netlify Function to handle GitHub OAuth callback
 * Replaces oauth.php
 */

export const handler = async function (event, context) {
	// Only allow GET requests
	if (event.httpMethod !== "GET") {
		return {
			statusCode: 405,
			body: JSON.stringify({ error: "Method not allowed" }),
		};
	}

	const code = event.queryStringParameters?.code;
	const clientId = process.env.GITHUB_CLIENT_ID;
	const clientSecret = process.env.GITHUB_CLIENT_SECRET;

	if (!code) {
		return {
			statusCode: 400,
			body: JSON.stringify({ error: "Missing authorization code" }),
		};
	}

	if (!clientId || !clientSecret) {
		return {
			statusCode: 500,
			body: JSON.stringify({ error: "Server configuration error" }),
		};
	}

	try {
		// Exchange code for access token
		// With Accept: "application/json", GitHub returns JSON response
		const response = await fetch(
			"https://github.com/login/oauth/access_token",
			{
				method: "POST",
				headers: {
					"Content-Type": "application/x-www-form-urlencoded",
					Accept: "application/json",
					Origin: process.env.SITE_URL || "https://dabblet.com",
				},
				body: new URLSearchParams({
					client_id: clientId,
					client_secret: clientSecret,
					code: code,
				}),
			},
		);

		const data = await response.json();

		if (!data.access_token) {
			return {
				statusCode: 400,
				body: JSON.stringify({
					error: data.error || "Failed to get access token",
					error_description: data.error_description || "",
				}),
			};
		}

		const token = data.access_token;

		return {
			statusCode: 200,
			headers: {
				"Content-Type": "text/html",
			},
			body: `<script>
opener.gist.oauth[1]('${token}');
close();
</script>`,
		};
	} catch (error) {
		return {
			statusCode: 500,
			body: JSON.stringify({ error: error.message }),
		};
	}
};
