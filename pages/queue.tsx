import { queueAtom } from "@/atoms/queue";
import { useAtom } from "jotai";

export default function Queue() {
  const [queue, setQueue] = useAtom(queueAtom);

  return (
    <div>
      <h1>Queue</h1>
      <ul>
        {queue.map((item) => (
          <li key={item.id}>{item.title}</li>
        ))}
      </ul>
    </div>
  );
}
