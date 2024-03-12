import { songsAtom } from '@/atoms/library';
import { usePlaylists } from '@/atoms/playlists';
import { Browser } from '@/components/browser';
import { useSetAtom } from 'jotai';
import { useRouter } from 'next/router'
import { useMemo } from 'react';

export default function Page() {
	const router = useRouter();
	const [playlists] = usePlaylists();
	const playlist = useMemo(() => playlists.find((playlist) => playlist.id === router.query.playlist), [playlists, router.query.playlist]);
	const setSongs = useSetAtom(songsAtom);
	if (!playlist) {
		router.replace('/');
	}
	// TODO: need a way to verify songs exist
	setSongs(playlist?.songs || [])
	return (
		<Browser />
	)
}
