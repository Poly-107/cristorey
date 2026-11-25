import type { SVGAttributes } from 'react';

export default function AppLogoIcon(props: SVGAttributes<SVGElement>) {
    return (
        <svg {...props} viewBox="0 0 40 42" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path d="M15 2h10v11h11v10H25v17H15V23H4V13h11V2Z" />
        </svg>
    );
}
