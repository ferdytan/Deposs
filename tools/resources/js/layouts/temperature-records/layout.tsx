import { PropsWithChildren } from 'react';

export default function TemperatureRecordsLayout({ children }: PropsWithChildren) {
    if (typeof window === 'undefined') return null;

    return (
        <div className="px-4 py-6">
            <div className="flex flex-col space-y-8 lg:flex-row lg:space-y-0 lg:space-x-12">
                <div className="max-w-[100%] flex-1">
                    <section className="space-y-12">{children}</section>
                </div>
            </div>
        </div>
    );
}
