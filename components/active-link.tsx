import { useRouter } from "next/router";
import Link, { LinkProps } from "next/link";
import React, { PropsWithChildren, useState, useEffect } from "react";

export type ActiveLinkProps = LinkProps & {
  className?: ({ isActive }: { isActive: boolean }) => string;
};

const ActiveLink = ({
  children,
  className,
  ...props
}: PropsWithChildren<ActiveLinkProps>) => {
  const { asPath, isReady } = useRouter();
  const [computedClassName, setComputedClassName] = useState(
    className?.({ isActive: false })
  );

  useEffect(() => {
    // Check if the router fields are updated client-side
    if (isReady) {
      // Dynamic route will be matched via props.as
      // Static route will be matched via props.href
      const linkPathname = new URL(
        (props.as || props.href) as string,
        location.href
      ).pathname;

      // Using URL().pathname to get rid of query and hash
      const activePathname = new URL(asPath, location.href).pathname;

      // If the linkPathname and activePathname are the same, then the link is active
      if (linkPathname === activePathname) {
        const newClassName = className?.({ isActive: true });
        if (newClassName !== computedClassName) {
          setComputedClassName(newClassName);
        }
      } else {
        const newClassName = className?.({ isActive: false });
        if (newClassName !== computedClassName) {
          setComputedClassName(newClassName);
        }
      }
    }
  }, [asPath, isReady, props.as, props.href, className, computedClassName]);

  return (
    <Link className={computedClassName} {...props}>
      {children}
    </Link>
  );
};

export default ActiveLink;
