import {
	type ColumnDef,
	type ColumnSizingState,
	type SortingState,
	type VisibilityState,
	getCoreRowModel,
	getSortedRowModel,
	useReactTable,
} from "@tanstack/react-table";
import { format } from "date-fns";
import { useMemo, useState } from "react";

export function useTable({ data }: { data: RawSong[] }) {
	const [columnSizing, setColumnSizing] = useState<ColumnSizingState>({});
	const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
		// track_number: false,
		disc_number: false,
	});
	const [sorting, setSorting] = useState<SortingState>([
		{
			desc: false,
			id: "artist",
		},
		{
			desc: false,
			id: "album_title",
		},
		{
			desc: false,
			id: "disc_number",
		},
		{
			desc: false,
			id: "track_number",
		},
	]);

	const columns = useMemo<ColumnDef<RawSong>[]>(
		() => [
			{
				id: "disc_number",
				accessorKey: "disc_number",
				header: "Disc",
			},
			{
				id: "track_number",
				accessorKey: "track_number",
				header: "#",
			},
			{
				id: "title",
				accessorKey: "title",
				header: "Title",
				minSize: 200,
				maxSize: undefined,
				cell: ({ row }) => {
					const item = row.original;
					return <div>{item.title}</div>;
				},
			},
			{
				id: "duration_ms",
				accessorKey: "duration_ms",
				header: "Time",
				cell: ({ row }) => {
					const item = row.original;
					const dur = format(item.duration_ms ?? 0, "mm:ss");
					return <div>{dur}</div>;
				},
			},
			{
				id: "artist",
				accessorKey: "artist",
				header: "Artist",
				cell: ({ row }) => {
					const item = row.original;
					return <div>{item.artist}</div>;
				},
			},
			{
				id: "album_title",
				accessorKey: "album_title",
				header: "Album",
				cell: ({ row }) => {
					const item = row.original;
					return <div>{item.album_title}</div>;
				},
			},
			{
				id: "genre",
				accessorKey: "genre",
				header: "Genre",
			},
		],
		[],
	);

	const table = useReactTable({
		data: useMemo(() => data, [data]),
		columns,
		defaultColumn: { minSize: 100, maxSize: 250 },
		state: { columnSizing, columnVisibility, sorting },
		onColumnVisibilityChange: setColumnVisibility,
		onColumnSizingChange: setColumnSizing,
		onSortingChange: setSorting,
		columnResizeMode: "onChange",
		getCoreRowModel: useMemo(() => getCoreRowModel(), []),
		getSortedRowModel: getSortedRowModel(),
		getRowId: (row) => row.id,
	});

	//   TODO: further initialization from stored data

	return {
		table,
	};
}
