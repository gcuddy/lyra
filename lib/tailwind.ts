import clsx from "clsx";
import React from "react";
// idk thisis from https://github.com/spacedriveapp/spacedrive/blob/43b6453706463b2ca4bf81ea09901c111f2320f6/packages/ui/src/utils.tsx
const twFactory =
  (element: any) =>
  ([newClassNames, ..._]: TemplateStringsArray) => {
    const r = React.forwardRef(({ className, ...props }: any, ref) =>
      React.createElement(element, {
        ...props,
        className: clsx(newClassNames, className),
        ref,
      })
    );
    r.displayName = `tw(${element})`;
    return r;
  };

type ClassnameFactory<T> = (s: TemplateStringsArray) => T;

type TailwindFactory = {
  [K in keyof JSX.IntrinsicElements]: ClassnameFactory<
    React.ForwardRefExoticComponent<JSX.IntrinsicElements[K]>
  >;
} & {
  <T>(c: T): ClassnameFactory<T>;
};

// eslint-ignore-next-line
export const tw = new Proxy((() => {}) as unknown as TailwindFactory, {
  get: (_, property: string) => twFactory(property),
  apply: (_, __, [el]: [React.ReactElement]) => twFactory(el),
});
