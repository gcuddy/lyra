import { cn } from "@/lib/utils";
import { Info } from "@phosphor-icons/react";
import { PropsWithChildren } from "react";
import { Tooltip } from "../ui/tooltip";

interface Props {
	title: string;
	description?: string | JSX.Element;
	mini?: boolean;
	className?: string;
	toolTipLabel?: string | boolean;
}


// million-ignore
export default function Setting({ mini, ...props }: PropsWithChildren<Props>) {
	if (typeof props.description === "string")
		props.description = (
			<p className="mb-2 text-sm text-gray-400">{props.description}</p>
		);

	return (
		<div className="relative flex flex-row">
			<div
				className={cn("flex w-full flex-col", !mini && "pb-6", props.className)}
			>
				<div className="mb-1 flex items-center gap-1">
					<h3 className="text-sm font-medium text-ink">{props.title}</h3>
					{props.toolTipLabel && (
						<Tooltip label={props.toolTipLabel as string}>
							<Info size={15} />
						</Tooltip>
					)}
				</div>
				<div className="w-[85%]">{props.description}</div>
				{!mini && props.children}
			</div>
			{mini && props.children}
		</div>
	);
};
