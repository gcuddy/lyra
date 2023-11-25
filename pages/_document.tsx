import { Head, Html, Main, NextScript } from "next/document";
import { Suspense } from "react";

export default function Document() {
	return (
		<Html lang="en" className="light">
			<Head />
			<body className="bg-app text-ink overflow-hidden overscroll-none">
				<Main />
				<NextScript />
			</body>
		</Html>
	);
}
