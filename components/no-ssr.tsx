import * as React from "react";
// very hacky way to get the whole to not use ssr (lol)
// you could also:
// (import me dynamically)
// https://nextjs.org/docs/pages/building-your-application/optimizing/lazy-loading#with-no-ssr

export function NoSSR(props: { children: React.ReactNode }) {
  const [isMounted, setIsMounted] = React.useState(false);
  React.useEffect(() => {
    setIsMounted(true);
  }, []);
  if (!isMounted) return null;
  return <>{props.children}</>;
}
