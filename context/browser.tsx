import { PropsWithChildren, createContext, useContext, useRef } from "react";

interface UseBrowserProps {
	items: RawSong[];
	count?: number;
	scrollRef?: React.RefObject<HTMLDivElement>;
}

export function useBrowser(props?: UseBrowserProps) {
	const scrollRef = useRef<HTMLDivElement>(null);
	return {
		scrollRef,
		...props,
	}
}

export type UseBrowser = ReturnType<typeof useBrowser>;

const BrowserContext = createContext<UseBrowser | null>(null);

export const useBrowserContext = () => {
	const context = useContext(BrowserContext);
	if (!context) {
		throw new Error("useBrowserContext must be used within a BrowserProvider");
	}
	return context;
}


export const BrowserContextProvider = ({
	browser,
	children
}: PropsWithChildren<{ browser: UseBrowser }>) => {
	return (
		<BrowserContext.Provider value={browser}>
			{children}
		</BrowserContext.Provider>
	)
}
