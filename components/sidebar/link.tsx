import Link, { LinkProps } from "next/link";
import React, { PropsWithChildren, forwardRef } from "react";
import { tv } from "tailwind-variants";
import ActiveLink, { type ActiveLinkProps } from "../active-link";
import { cn } from "@/lib/utils";
const styles = tv({
  base: "max-w flex grow flex-row items-center gap-0.5 truncate rounded px-2 py-1 text-sm font-medium outline-none ring-inset ring-transparent ring-offset-0 focus:ring-1 focus:ring-accent focus:ring-offset-0",
  variants: {
    active: {
      true: "bg-sidebar-selected/50 text-sidebar-ink",
      false: "text-sidebar-inkDull",
    },
    transparent: {
      true: "bg-opacity-90",
      false: "",
    },
  },
});

const NavLink = forwardRef<
  HTMLAnchorElement,
  PropsWithChildren<ActiveLinkProps>
>(({ className, ...props }, ref) => {
  return (
    <ActiveLink
      className={({ isActive }) => cn(styles({ active: isActive }), className)}
      {...props}
    >
      {/* ref={ref} */}
      {props.children}
    </ActiveLink>
  );
});

NavLink.displayName = "NavLink";

export default NavLink;
