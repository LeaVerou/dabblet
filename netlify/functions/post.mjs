/**
 * Netlify Function to handle POST requests with CSS, HTML, and JavaScript
 * Replaces the old index-php.php functionality
 */
import { readFileSync } from "node:fs";

function escape (string = "") {
	return string.replace(/\\/g, "").replace(/</g, "&lt;");
}

export const handler = async function (event, context) {
	if (event.httpMethod !== "POST") {
		return {
			statusCode: 405,
			headers: { Allow: "POST" },
			body: JSON.stringify({ error: "Method not allowed" }),
		};
	}

	// Parse form data (same as PHP $_POST)
	const params = new URLSearchParams(event.body ?? "");
	const css = params.get("css") ?? "";
	const html = params.get("html") ?? "";
	const js = params.get("javascript") ?? params.get("js") ?? "";

	// Read template file
	let template;
	try {
		template = readFileSync(
			process.env.LAMBDA_TASK_ROOT + "/post-template.html",
			"utf8",
		);
	}
	catch (error) {
		return {
			statusCode: 500,
			body: JSON.stringify({
				error: "Failed to load template",
				details: error.message,
			}),
		};
	}

	// Replace placeholders with escaped content (same as PHP echo)
	template = template
		.replace("{{CSS}}", escape(css))
		.replace("{{HTML}}", escape(html))
		.replace("{{JS}}", escape(js));

	return {
		statusCode: 200,
		headers: { "Content-Type": "text/html; charset=utf-8" },
		body: template,
	};
};
