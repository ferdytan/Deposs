import { PropsWithChildren } from 'react';

// const sidebarNavItems = [
//     {
//         title: 'Product List',
//         href: '/products',
//         icon: null,
//     },
//     {
//         title: 'Create Product',
//         href: '/products/create',
//         icon: null,
//     },
// ];

export default function ProductsLayout({ children }: PropsWithChildren) {
    if (typeof window === 'undefined') return null;

    // const currentPath = window.location.pathname;

    return (
        <div className="px-4 py-6">
            {/* <Heading title="Product Management" description="Manage all products and pricing" /> */}

            <div className="flex flex-col space-y-8 lg:flex-row lg:space-y-0 lg:space-x-12">
                {/* <aside className="w-full max-w-xl lg:w-48">
                    <nav className="flex flex-col space-y-1 space-x-0">
                        {sidebarNavItems.map((item, index) => (
                            <Button
                                key={`${item.href}-${index}`}
                                size="sm"
                                variant="ghost"
                                asChild
                                className={cn('w-full justify-start', {
                                    'bg-muted': currentPath === item.href,
                                })}
                            >
                                <Link href={item.href} prefetch>
                                    {item.title}
                                </Link>
                            </Button>
                        ))}
                    </nav>
                </aside>

                <Separator className="my-6 md:hidden" /> */}

                <div className="flex-1">
                    <section className="space-y-12">{children}</section>
                </div>
            </div>
        </div>
    );
}
