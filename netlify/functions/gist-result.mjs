/**
 * Netlify Function to fetch and render gist data
 * Replaces result/index.php
 */

export const handler = async function (event, context) {
	// Only allow GET requests
	if (event.httpMethod !== "GET") {
		return {
			statusCode: 405,
			body: JSON.stringify({ error: "Method not allowed" })
		};
	}

	// Extract gist ID and revision from path
	// Netlify redirects preserve the original path in event.path
	// The path will be like "/result/gist/123abc" or "/result/gist/123abc/456def"
	const pathMatch = event.path.match(/\/gist\/([\da-f]+)(?:\/([\da-f]+))?/i);
	
	if (!pathMatch) {
		return {
			statusCode: 400,
			body: JSON.stringify({ error: "Invalid gist path" })
		};
	}

	const gistId = pathMatch[1];
	const gistRev = pathMatch[2] || "";

	const clientId = process.env.GITHUB_CLIENT_ID;
	const clientSecret = process.env.GITHUB_CLIENT_SECRET;

	let uri = `https://api.github.com/gists/${ gistId }`;
	if (gistRev) {
		uri += `/${ gistRev }`;
	}
	if (clientId && clientSecret) {
		uri += `?client_id=${ clientId }&client_secret=${ clientSecret }`;
	}

	try {
		const response = await fetch(uri, {
			headers: {
				"User-Agent": "Dabblet.com"
			}
		});

		if (!response.ok) {
			return {
				statusCode: response.status,
				body: JSON.stringify({ error: "Gist not found" })
			};
		}

		const data = await response.json();

		if (!data || !data.files || data.message) {
			return {
				statusCode: 404,
				body: data?.message || "Not found, sorry! :("
			};
		}

		// Find CSS, HTML, and JS files
		let css = data.files["dabblet.css"]?.content;
		let html = data.files["dabblet.html"]?.content;
		let js = data.files["dabblet.js"]?.content;
		const settings = data.files["settings.json"]?.content;

		// Fallback: find files by extension
		if (!css) {
			for (const filename in data.files) {
				if (filename.indexOf(".css") > 0) {
					css = data.files[filename].content;
					break;
				}
			}
		}

		if (!html) {
			for (const filename in data.files) {
				if (filename.indexOf(".html") > 0) {
					html = data.files[filename].content;
					break;
				}
			}
		}

		if (!js) {
			for (const filename in data.files) {
				if (filename.indexOf(".js") > 0) {
					js = data.files[filename].content;
					break;
				}
			}
		}

		// Parse settings
		let settingsObj = {};
		if (settings) {
			try {
				settingsObj = JSON.parse(settings);
			} catch (e) {
				// Invalid JSON, use defaults
			}
		}

		// Format CSS
		const cssContent = css && css.indexOf("{") === -1 ? `html{${ css }}` : (css || "");

		// Determine if prefix-free should be used
		const usePrefixFree = (
			!settingsObj.version && !settingsObj.prefixfree
		) || settingsObj.prefixfree || settingsObj.settings?.prefixfree;

		// Build HTML
		const title = data.description || "Dabblet result";
		// Use relative path for prefixfree script (works on any domain)
		const siteUrl = process.env.SITE_URL || "https://dabblet.com";
		const prefixFreeScript = usePrefixFree
			? `<script src="${ siteUrl }/code/prefixfree.min.js"></script>`
			: "";
		const jsScript = js
			? `<script>
if (parent === window) {
	document.addEventListener('DOMContentLoaded', function() {
		${ js }
	});
}
</script>`
			: "";

		const htmlContent = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<title>${ title }</title>
<style>
${ cssContent }
</style>
${ prefixFreeScript }
${ jsScript }
</head>
<body>${ html || "" }</body>
</html>`;

		return {
			statusCode: 200,
			headers: {
				"Content-Type": "text/html; charset=utf-8"
			},
			body: htmlContent
		};
	} catch (error) {
		return {
			statusCode: 500,
			body: JSON.stringify({ error: error.message })
		};
	}
};
