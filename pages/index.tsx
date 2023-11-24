import { useDirectoryPath } from "@/atoms/paths";
import { useMainScrollRef } from "@/atoms/refs";
import Library from "@/components/library";
// import { appWindow, WebviewWindow } from "@tauri-apps/api/window";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

export default function Home() {
	const [directoryPath, setDirectoryPath] = useDirectoryPath();
	const [mainScrollRef] = useMainScrollRef();
	console.log({ directoryPath });
	return (
		<>
			{directoryPath ? (
				<Library scrollElement={mainScrollRef} path={directoryPath} />
			) : (
				<>
					<div>Please select a directory</div>
				</>
			)}
		</>
	);
}
