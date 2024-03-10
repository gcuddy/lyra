import { PropsWithChildren, ReactNode } from "react";

interface HeaderProps extends PropsWithChildren {
	title: string;
	description: string | ReactNode;
	rightArea?: ReactNode;
}

export const Heading = (props: HeaderProps) => {
	return (
		<div className="mb-3 flex">
			<div className="grow">
				<h1 className="text-2xl text-ink font-bold">{props.title}</h1>
				<p className="mt-1 text-sm text-ink-dull">{props.description}</p>
			</div>
			<hr className="mt-4 border-app-line" />
		</div>
	);
};
