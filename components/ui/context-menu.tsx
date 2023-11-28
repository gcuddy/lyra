import { cn } from "@/lib/utils";
import { CaretRight, Check, Icon, IconProps } from "@phosphor-icons/react";
import * as RadixCM from "@radix-ui/react-context-menu";
import {
	ContextType,
	PropsWithChildren,
	Suspense,
	createContext,
	useContext,
} from "react";

// largely taken from https://github.com/spacedriveapp/spacedrive/blob/43b6453706463b2ca4bf81ea09901c111f2320f6/packages/ui/src/ContextMenu.tsx
// TODO: customize to fit our needs

import { VariantProps, tv } from "tailwind-variants";

export const contextMenuClassNames = cn(
	"z-50 max-h-[calc(100vh-20px)] overflow-y-auto ",
	"my-2 min-w-[12rem] max-w-[16rem] py-0.5",
	"cool-shadow bg-menu/90 backdrop-blur-sm",
	"border border-menu-line",
	"cursor-default select-none rounded-md",
	"animate-in fade-in",
);

interface ContextMenuProps extends RadixCM.MenuContentProps {
	trigger: React.ReactNode;
	onOpenChange?: (open: boolean) => void;
	disabled?: boolean;
}

const ContextMenuContext = createContext<boolean | null>(null);

const Root = ({
	trigger,
	children,
	className,
	onOpenChange,
	disabled,
	...props
}: ContextMenuProps) => {
	return (
		<RadixCM.Root onOpenChange={onOpenChange}>
			<RadixCM.Trigger
				asChild
				onContextMenu={(e) => disabled && e.preventDefault()}
			>
				{trigger}
			</RadixCM.Trigger>
			<RadixCM.Portal>
				<RadixCM.Content
					className={cn(contextMenuClassNames, className)}
					{...props}
				>
					<ContextMenuContext.Provider value={true}>
						{children}
					</ContextMenuContext.Provider>
				</RadixCM.Content>
			</RadixCM.Portal>
		</RadixCM.Root>
	);
};

export const useContextMenuContext = <T extends boolean>({
	suspense,
}: { suspense?: T } = {}) => {
	const ctx = useContext(ContextMenuContext);

	if (suspense && ctx === null)
		throw new Error("ContextMenuContext.Provider not found!");

	return ctx as T extends true
		? NonNullable<ContextType<typeof ContextMenuContext>>
		: NonNullable<ContextType<typeof ContextMenuContext>> | undefined;
};

export const contextMenuSeparatorClassNames =
	"border-b-menu-line mx-1 my-0.5 border-b";

const Separator = (props: { className?: string }) => (
	<RadixCM.Separator
		className={cn(contextMenuSeparatorClassNames, props.className)}
	/>
);

const SubMenu = ({
	label,
	icon,
	className,
	...props
}: RadixCM.MenuSubContentProps & ContextMenuItemProps) => {
	return (
		<RadixCM.Sub>
			<RadixCM.SubTrigger className={contextMenuItemClassNames}>
				<ContextMenuDivItem rightArrow {...{ label, icon }} />
			</RadixCM.SubTrigger>
			<RadixCM.Portal>
				<Suspense fallback={null}>
					<RadixCM.SubContent
						className={cn(contextMenuClassNames, "-mt-2", className)}
						{...props}
					/>
				</Suspense>
			</RadixCM.Portal>
		</RadixCM.Sub>
	);
};

const contextMenuItemStyles = tv({
	base: [
		"flex max-h-fit min-h-[26px] items-center space-x-2 overflow-hidden rounded px-2",
		"text-sm text-menu-ink",
		"group-radix-highlighted:text-white",
		"group-radix-disabled:pointer-events-none group-radix-disabled:text-menu-ink/50",
		"group-radix-state-open:bg-accent group-radix-state-open:text-white",
	],
	variants: {
		variant: {
			default: "group-radix-highlighted:bg-accent",
			dull: "group-radix-highlighted:bg-app-selected/50 group-radix-state-open:bg-app-selected/50",
			danger: [
				"text-red-600 dark:text-red-400",
				"group-radix-highlighted:text-white",
				"group-radix-highlighted:bg-red-500",
			],
		},
	},
	defaultVariants: {
		variant: "default",
	},
});

export interface ContextMenuItemProps
	extends RadixCM.MenuItemProps,
		VariantProps<typeof contextMenuItemStyles>,
		Pick<
			ContextMenuInnerItemProps,
			"label" | "keybind" | "icon" | "iconProps"
		> {}

export const contextMenuItemClassNames = "group py-0.5 outline-none px-1";

const Item = ({
	icon,
	label,
	children,
	keybind,
	variant,
	iconProps,
	onClick,
	...props
}: ContextMenuItemProps) => {
	return (
		<RadixCM.Item
			{...props}
			className={cn(contextMenuItemClassNames, props.className)}
			onClick={(e) => !props.disabled && onClick?.(e)}
		>
			<ContextMenuDivItem
				{...{ icon, iconProps, label, keybind, variant, children }}
			/>
		</RadixCM.Item>
	);
};

export interface ContextMenuCheckboxItemProps
	extends RadixCM.MenuCheckboxItemProps,
		VariantProps<typeof contextMenuItemStyles>,
		Pick<ContextMenuInnerItemProps, "label" | "keybind"> {}

const CheckboxItem = ({
	variant,
	className,
	label,
	keybind,
	children,
	...props
}: ContextMenuCheckboxItemProps) => {
	return (
		<RadixCM.CheckboxItem className={contextMenuItemClassNames} {...props}>
			<ContextMenuDivItem variant={variant} className={className}>
				<span className="flex h-3.5 w-3.5 items-center justify-center">
					<RadixCM.ItemIndicator>
						<Check weight="bold" />
					</RadixCM.ItemIndicator>
				</span>

				<ItemInternals {...{ label, keybind, children }} />
			</ContextMenuDivItem>
		</RadixCM.CheckboxItem>
	);
};

interface ContextMenuInnerItemProps {
	icon?: Icon;
	iconProps?: IconProps;
	label?: string;
	keybind?: string;
	rightArrow?: boolean;
}

export const ContextMenuDivItem = ({
	variant,
	children,
	className,
	...props
}: ContextMenuInnerItemProps &
	VariantProps<typeof contextMenuItemStyles> &
	PropsWithChildren<{ className?: string }>) => (
	<div className={contextMenuItemStyles({ variant, className })}>
		{children || <ItemInternals {...props} />}
	</div>
);

const ItemInternals = ({
	icon,
	label,
	rightArrow,
	keybind,
	iconProps,
}: ContextMenuInnerItemProps) => {
	const ItemIcon = icon;

	return (
		<>
			{ItemIcon && <ItemIcon size={18} {...iconProps} />}
			{label && <span className="flex-1 truncate">{label}</span>}

			{keybind && (
				<span className="text-xs font-medium group-radix-highlighted:text-white">
					{keybind}
				</span>
			)}
			{rightArrow && (
				<CaretRight
					weight="fill"
					size={12}
					className="text-menu-faint group-radix-highlighted:text-white group-radix-state-open:text-white"
				/>
			)}
		</>
	);
};

export const ContextMenu = {
	Root,
	Item,
	CheckboxItem,
	Separator,
	SubMenu,
};
