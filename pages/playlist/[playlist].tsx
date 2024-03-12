import { useRouter } from 'next/router'

export default function Page() {
	const router = useRouter();
	return (
		<div>
			<h1>Playlist id: {router.query.playlist}</h1>
		</div>
	)
}
