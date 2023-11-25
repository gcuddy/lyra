import * as SliderPrimitive from "@radix-ui/react-slider";
import * as React from "react";

import { cn } from "@/lib/utils";

const HuePicker = React.forwardRef<
	React.ElementRef<typeof SliderPrimitive.Root>,
	React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, ...props }, ref) => {
	return (
		<SliderPrimitive.Root
			ref={ref}
			className={cn(
				"relative flex w-full touch-none select-none items-center",
				className,
			)}
			min={0}
			max={360}
			step={1}
			{...props}
		>
			<SliderPrimitive.Track
				style={{
					background:
						"linear-gradient(90deg,red 0,#ff0 17%,#0f0 33%,#0ff 50%,#00f 67%,#f0f 83%,red)",
				}}
				className="relative h-6 w-full grow overflow-hidden rounded-md"
			>
				{/* <SliderPrimitive.Range className="absolute h-full bg-gray-400" /> */}
			</SliderPrimitive.Track>
			<SliderPrimitive.Thumb
				style={{
					background: `hsl(${props.value?.[0]}, 100%, 50%)`,
				}}
				className="block h-7 w-7 focus:h-8 focus:w-8 shadow rounded-full border-2 border-white ring-app-line transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
			/>
		</SliderPrimitive.Root>
	);
});
HuePicker.displayName = SliderPrimitive.Root.displayName;

export { HuePicker };
