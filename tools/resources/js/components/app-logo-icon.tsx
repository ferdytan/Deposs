interface AppLogoIconProps {
    className?: string;
    width?: number | string;
    height?: number | string;
}

export default function AppLogoIcon({ className, width = 40, height = 42 }: AppLogoIconProps) {
    return (
        <img
            src="/logo.png" // Gambar ada di public/, jadi cukup pakai path relatif
            alt="App Logo"
            className={className}
            width={width}
            height={height}
        />
    );
}
