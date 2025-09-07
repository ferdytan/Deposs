import { PropsWithChildren } from 'react';

export default function OrdersLayout({ children }: PropsWithChildren) {
    if (typeof window === 'undefined') return null;

    return (
        <div className="w-full px-2 py-6 sm:px-4">
            <div className="flex w-full flex-col space-y-8 lg:flex-row lg:space-y-0 lg:space-x-12">
                {/* Area Konten Utama */}
                <div className="w-full min-w-0 flex-1">
                    <section className="w-full space-y-12">{children}</section>
                </div>
            </div>
        </div>
    );
}
