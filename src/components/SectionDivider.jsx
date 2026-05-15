export default function SectionDivider({ onDark = false, mark = '✚' }) {
    return (
        <div
            className={`section-divider${onDark ? ' section-divider--on-dark' : ''}`}
            aria-hidden="true"
        >
            <div className={`divider-ornament${onDark ? ' on-dark' : ''}`}>
                <span>{mark}</span>
            </div>
        </div>
    );
}
