import './PhotoScrollBg.css'; 
const PhotoScrollBackground = () => {
    const photos = [
        'https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg?auto=compress&cs=tinysrgb&w=1200',
        'https://images.pexels.com/photos/1043474/pexels-photo-1043474.jpeg?auto=compress&cs=tinysrgb&w=1200',
        'https://images.pexels.com/photos/1438072/pexels-photo-1438072.jpeg?auto=compress&cs=tinysrgb&w=1200',
        'https://images.pexels.com/photos/2422915/pexels-photo-2422915.jpeg?auto=compress&cs=tinysrgb&w=1200',
        'https://images.pexels.com/photos/3184339/pexels-photo-3184339.jpeg?auto=compress&cs=tinysrgb&w=1200',
        'https://images.pexels.com/photos/3228727/pexels-photo-3228727.jpeg?auto=compress&cs=tinysrgb&w=1200',
        'https://images.pexels.com/photos/3760263/pexels-photo-3760263.jpeg?auto=compress&cs=tinysrgb&w=1200',
        'https://images.pexels.com/photos/4065906/pexels-photo-4065906.jpeg?auto=compress&cs=tinysrgb&w=1200',
        'https://images.pexels.com/photos/32307142/pexels-photo-32307142.jpeg?auto=compress&cs=tinysrgb&w=1200',
        'https://images.pexels.com/photos/31594411/pexels-photo-31594411.jpeg?auto=compress&cs=tinysrgb&w=1200',
        'https://images.pexels.com/photos/31540692/pexels-photo-31540692.jpeg?auto=compress&cs=tinysrgb&w=1200',
        'https://images.pexels.com/photos/4348401/pexels-photo-4348401.jpeg?auto=compress&cs=tinysrgb&w=1200',
        'https://images.pexels.com/photos/5384445/pexels-photo-5384445.jpeg?auto=compress&cs=tinysrgb&w=1200',
        'https://images.pexels.com/photos/6032877/pexels-photo-6032877.jpeg?auto=compress&cs=tinysrgb&w=1200',
        'https://images.pexels.com/photos/1040881/pexels-photo-1040881.jpeg?auto=compress&cs=tinysrgb&w=1200',
        'https://images.pexels.com/photos/1212984/pexels-photo-1212984.jpeg?auto=compress&cs=tinysrgb&w=1200',
        'https://images.pexels.com/photos/1758144/pexels-photo-1758144.jpeg?auto=compress&cs=tinysrgb&w=1200',
        'https://images.pexels.com/photos/32239849/pexels-photo-32239849.jpeg?auto=compress&cs=tinysrgb&w=1200',
        'https://images.pexels.com/photos/2193300/pexels-photo-2193300.jpeg?auto=compress&cs=tinysrgb&w=1200',
        'https://images.pexels.com/photos/374906/pexels-photo-374906.jpeg?auto=compress&cs=tinysrgb&w=1200',
        'https://images.pexels.com/photos/32730389/pexels-photo-32730389.jpeg?auto=compress&cs=tinysrgb&w=1200',
        'https://images.pexels.com/photos/32475260/pexels-photo-32475260.jpeg?auto=compress&cs=tinysrgb&w=1200',
        'https://images.pexels.com/photos/31752801/pexels-photo-31752801.jpeg?auto=compress&cs=tinysrgb&w=1200',
        'https://images.pexels.com/photos/32607286/pexels-photo-32607286.jpeg?auto=compress&cs=tinysrgb&w=1200',
        'https://images.pexels.com/photos/17858081/pexels-photo-17858081.jpeg?auto=compress&cs=tinysrgb&w=1200',
        'https://images.pexels.com/photos/32470928/pexels-photo-32470928.jpeg?auto=compress&cs=tinysrgb&w=1200',
        'https://images.pexels.com/photos/32533642/pexels-photo-32533642.jpeg?auto=compress&cs=tinysrgb&w=1200',
        'https://images.pexels.com/photos/32506787/pexels-photo-32506787.jpeg?auto=compress&cs=tinysrgb&w=1200',
        'https://images.pexels.com/photos/32192165/pexels-photo-32192165.jpeg?auto=compress&cs=tinysrgb&w=1200',
        'https://images.pexels.com/photos/32397290/pexels-photo-32397290.jpeg?auto=compress&cs=tinysrgb&w=1200',
        'https://images.pexels.com/photos/32419496/pexels-photo-32419496.jpeg?auto=compress&cs=tinysrgb&w=1200',
        'https://images.pexels.com/photos/32432874/pexels-photo-32432874.jpeg?auto=compress&cs=tinysrgb&w=1200',
        'https://images.pexels.com/photos/18333445/pexels-photo-18333445.jpeg?auto=compress&cs=tinysrgb&w=1200',
        'https://images.pexels.com/photos/8285086/pexels-photo-8285086.jpeg?auto=compress&cs=tinysrgb&w=1200',
        'https://images.pexels.com/photos/32437895/pexels-photo-32437895.jpeg?auto=compress&cs=tinysrgb&w=1200',
        'https://images.pexels.com/photos/32405369/pexels-photo-32405369.jpeg?auto=compress&cs=tinysrgb&w=1200',
        'https://images.pexels.com/photos/11311708/pexels-photo-11311708.jpeg?auto=compress&cs=tinysrgb&w=1200',
        'https://images.pexels.com/photos/32232143/pexels-photo-32232143.jpeg?auto=compress&cs=tinysrgb&w=1200',
        'https://images.pexels.com/photos/5781919/pexels-photo-5781919.jpeg?auto=compress&cs=tinysrgb&w=1200',
        'https://images.pexels.com/photos/3518400/pexels-photo-3518400.jpeg?auto=compress&cs=tinysrgb&w=1200',

    ];

    // Distribute into rows
    const row1 = [...photos.slice(0, 6), ...photos.slice(0, 6)];
    const row2 = [...photos.slice(24, 36), ...photos.slice(30, 42)];
    const row3 = [...photos.slice(12, 18), ...photos.slice(12, 18)];
    const row4 = [...photos.slice(18, 24), ...photos.slice(18, 24)];
    const row5 = [...photos.slice(6, 12), ...photos.slice(6, 12)];

    return (

        <div className="scroll-background">
            <div className="diagonal-track-wrapper" style={{ top: '-33%' }}>
                <div className="scroll-row scroll-slow-left">
                    {row1.map((src, i) => (
                        <div key={i} className="scroll-image">
                            <img src={src} alt={`row1-${i}`} />
                        </div>
                    ))}
                </div>
            </div>
            <div className="diagonal-track-wrapper" style={{ top: '1%' }}>

                <div className="scroll-row scroll-medium-right">
                    {row2.map((src, i) => (
                        <div key={i} className="scroll-image">
                            <img src={src} alt={`row2-${i}`} />
                        </div>
                    ))}
                </div>
            </div>

            <div className="diagonal-track-wrapper" style={{ top: '35%' }}>

                <div className="scroll-row scroll-medium-left">
                    {row3.map((src, i) => (
                        <div key={i} className="scroll-image">
                            <img src={src} alt={`row3-${i}`} />
                        </div>
                    ))}
                </div>
            </div>
            <div className="diagonal-track-wrapper" style={{ top: '70%' }}>

                <div className="scroll-row scroll-slow-right">
                    {row4.map((src, i) => (
                        <div key={i} className="scroll-image">
                            <img src={src} alt={`row4-${i}`} />
                        </div>
                    ))}
                </div>
            </div>
            <div className="diagonal-track-wrapper" style={{ top: '105%' }}>

                <div className="scroll-row scroll-fast-left">
                    {row5.map((src, i) => (
                        <div key={i} className="scroll-image">
                            <img src={src} alt={`row5-${i}`} />
                        </div>
                    ))}
                </div>
            </div>

            <div className="gradient-blur-overlay" />

        </div>
    );
};

export default PhotoScrollBackground;
