<!DOCTYPE html>

<html class="dark" lang="en"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>FlyerGen AI - Dashboard</title>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600&amp;family=Space+Grotesk:wght@500;600;700&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<script id="tailwind-config">
        tailwind.config = {
            darkMode: "class",
            theme: {
                extend: {
                    "colors": {
                        "surface-bright": "#3c3742",
                        "tertiary-fixed-dim": "#7bd0ff",
                        "secondary-container": "#3f465c",
                        "primary-fixed": "#eaddff",
                        "surface-container-highest": "#37333e",
                        "primary-container": "#7c3aed",
                        "primary-fixed-dim": "#d2bbff",
                        "on-primary-fixed": "#25005a",
                        "primary": "#d2bbff",
                        "tertiary": "#7bd0ff",
                        "secondary-fixed": "#dae2fd",
                        "outline-variant": "#4a4455",
                        "outline": "#958da1",
                        "surface-tint": "#d2bbff",
                        "on-primary-fixed-variant": "#5a00c6",
                        "on-surface": "#e8dfee",
                        "secondary-fixed-dim": "#bec6e0",
                        "on-tertiary-fixed": "#001e2c",
                        "on-surface-variant": "#ccc3d8",
                        "surface-container-high": "#2c2833",
                        "on-tertiary": "#00354a",
                        "inverse-surface": "#e8dfee",
                        "on-secondary-fixed": "#131b2e",
                        "surface-container-low": "#1d1a24",
                        "on-tertiary-fixed-variant": "#004c69",
                        "on-primary": "#3f008e",
                        "on-error": "#690005",
                        "surface-container": "#221e28",
                        "secondary": "#bec6e0",
                        "inverse-primary": "#732ee4",
                        "inverse-on-surface": "#332f39",
                        "on-background": "#e8dfee",
                        "tertiary-container": "#006e95",
                        "surface-variant": "#37333e",
                        "error": "#ffb4ab",
                        "on-secondary-fixed-variant": "#3f465c",
                        "on-tertiary-container": "#caeaff",
                        "surface-dim": "#15121b",
                        "surface-container-lowest": "#100d16",
                        "tertiary-fixed": "#c4e7ff",
                        "on-secondary-container": "#adb4ce",
                        "background": "#15121b",
                        "on-secondary": "#283044",
                        "surface": "#15121b",
                        "on-primary-container": "#ede0ff",
                        "on-error-container": "#ffdad6",
                        "error-container": "#93000a"
                    },
                    "borderRadius": {
                        "DEFAULT": "0.25rem",
                        "lg": "0.5rem",
                        "xl": "0.75rem",
                        "full": "9999px"
                    },
                    "spacing": {
                        "lg": "48px",
                        "sm": "12px",
                        "md": "24px",
                        "margin": "32px",
                        "xs": "4px",
                        "xl": "80px",
                        "gutter": "24px",
                        "base": "8px"
                    },
                    "fontFamily": {
                        "label-sm": ["Inter"],
                        "headline-sm": ["Space Grotesk"],
                        "body-md": ["Inter"],
                        "headline-md": ["Space Grotesk"],
                        "display-lg": ["Space Grotesk"],
                        "body-lg": ["Inter"]
                    },
                    "fontSize": {
                        "label-sm": ["12px", {"lineHeight": "1.0", "letterSpacing": "0.05em", "fontWeight": "600"}],
                        "headline-sm": ["24px", {"lineHeight": "1.3", "fontWeight": "500"}],
                        "body-md": ["16px", {"lineHeight": "1.5", "fontWeight": "400"}],
                        "headline-md": ["32px", {"lineHeight": "1.2", "letterSpacing": "-0.01em", "fontWeight": "600"}],
                        "display-lg": ["48px", {"lineHeight": "1.1", "letterSpacing": "-0.02em", "fontWeight": "700"}],
                        "body-lg": ["18px", {"lineHeight": "1.6", "fontWeight": "400"}]
                    }
                }
            }
        }
    </script>
<style>
        .glass-panel {
            background: rgba(34, 30, 40, 0.7);
            backdrop-filter: blur(16px);
            -webkit-backdrop-filter: blur(16px);
            border-top: 1px solid rgba(255, 255, 255, 0.1);
            border-left: 1px solid rgba(255, 255, 255, 0.1);
        }
        .neon-glow {
            box-shadow: 0 0 20px rgba(124, 58, 237, 0.15);
        }
    </style>
<style>
    body {
      min-height: max(884px, 100dvh);
    }
  </style>
  </head>
<body class="bg-background text-on-background min-h-screen pb-safe">
<!-- TopAppBar (Mobile) -->
<header class="fixed top-0 w-full z-50 flex md:hidden justify-between items-center px-4 h-16 bg-slate-950/70 backdrop-blur-md font-['Space_Grotesk'] font-medium docked full-width top-0 shadow-none border-b border-transparent">
<button class="text-slate-300 hover:opacity-80 transition-opacity p-2">
<span class="material-symbols-outlined">menu</span>
</button>
<div class="text-lg font-black text-violet-500 tracking-tight">FlyerGen AI</div>
<button class="text-slate-300 hover:opacity-80 transition-opacity p-2">
<div class="w-8 h-8 rounded-full bg-surface-variant overflow-hidden">
<img alt="User avatar" class="w-full h-full object-cover" data-alt="close up portrait of a young professional smiling softly with neutral background lighting" src="https://lh3.googleusercontent.com/aida-public/AB6AXuC1CPkbnniUblcDHo3QR_LNpwvacp0I9Zd7T5m_6tvinOU2ZyV1SZAao5AftNlgiYKnHFpGla3s7LmBijhULH4zBJtRJbYBBsahyRdQzqpux9WlPiPIf8kAMsKE47BxKHkJ4G4u0V6bgUyrVj0ByjZLuQr69_UOT4J5z89uH6zDYTxumZ53tUvnc5qErgod_symatno7CrEhaKpei4Vrn-ZJ_sA_E9tp0Fz9MezusKsETuldE2b5rRUz3gAUWE90C97CcCMRUaeL1PC"/>
</div>
</button>
</header>
<!-- NavigationDrawer (Desktop) -->
<nav class="fixed left-0 top-0 h-screen z-40 hidden md:flex flex-col p-4 w-[280px] border-r border-white/10 shadow-[10px_0_30px_-15px_rgba(124,58,237,0.1)] bg-slate-950/70 backdrop-blur-lg font-['Space_Grotesk'] antialiased">
<div class="flex items-center gap-3 mb-8 px-4 mt-4">
<div class="w-10 h-10 rounded-full bg-surface-variant overflow-hidden">
<img alt="User profile" class="w-full h-full object-cover" data-alt="close up portrait of a young professional smiling softly with neutral background lighting" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAt5hjDXWNjUzsw2lqfLYaameEB7hAOP0SFg_ATFINX67m6tu5d91QrnKVVsJyQiAjKKjui0VpW_OQdnEEt5ebU7iiHp8EXV9Ed9X_sWotJLj4FHIA3OJ3ozTfIvG0Zx698Ym3OnqSd-mqQg9-XohJa4s3HAiXKjY6qNacIKkPwe4_2-o2nhqb-tFtglyhfWgP6mbk_dtZoc7Ap2xRTntyQcHNlQcRQQR9A5bmloSgfZ1Pd-1JhH9ZOfCoer0Uh6LVaorUpxfWR1l2j"/>
</div>
<div>
<div class="font-bold text-sm">Creative Pro</div>
<div class="text-xs text-slate-400">Pro Plan</div>
</div>
</div>
<div class="px-4 mb-6">
<div class="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-500 to-emerald-400">FlyerGen AI</div>
</div>
<ul class="flex flex-col gap-2">
<li>
<a class="flex items-center gap-3 px-4 py-3 rounded-lg bg-violet-600/20 text-emerald-400 font-bold border-l-2 border-emerald-400" href="#">
<span class="material-symbols-outlined">dashboard</span>
                    Dashboard
                </a>
</li>
<li>
<a class="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-400 hover:text-slate-100 transition-colors hover:bg-white/5 transition-all duration-200" href="#">
<span class="material-symbols-outlined">auto_awesome</span>
                    Generate
                </a>
</li>
<li>
<a class="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-400 hover:text-slate-100 transition-colors hover:bg-white/5 transition-all duration-200" href="#">
<span class="material-symbols-outlined">collections</span>
                    Gallery
                </a>
</li>
<li>
<a class="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-400 hover:text-slate-100 transition-colors hover:bg-white/5 transition-all duration-200" href="#">
<span class="material-symbols-outlined">settings</span>
                    Settings
                </a>
</li>
</ul>
</nav>
<!-- Main Content Canvas -->
<main class="md:ml-[280px] pt-20 md:pt-8 px-4 md:px-margin pb-24 md:pb-8 max-w-7xl mx-auto">
<!-- Header Section -->
<div class="mb-md">
<h1 class="font-headline-md text-headline-md text-on-surface mb-xs">Welcome back, Creative</h1>
<p class="font-body-md text-body-md text-on-surface-variant">Ready to design something amazing today?</p>
</div>
<!-- Create New Flyer Section (Bento Style) -->
<div class="grid grid-cols-1 lg:grid-cols-12 gap-md mb-lg">
<!-- Prompt Area (Spans 8 cols) -->
<div class="lg:col-span-8 glass-panel rounded-xl p-md neon-glow flex flex-col justify-between">
<div>
<div class="flex items-center gap-2 mb-sm">
<span class="material-symbols-outlined text-primary-container" style="font-variation-settings: 'FILL' 1;">auto_awesome</span>
<h2 class="font-headline-sm text-headline-sm text-on-surface">Create New Flyer</h2>
</div>
<p class="font-body-md text-body-md text-on-surface-variant mb-md">Describe the flyer you want to generate. Be specific about the event, style, and key elements.</p>
<div class="relative mb-md">
<textarea class="w-full h-32 bg-surface-container-low border border-outline-variant rounded-lg p-sm font-body-md text-body-md text-on-surface focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container transition-colors resize-none placeholder-on-surface-variant/50" placeholder="A modern flyer for a tech conference in San Francisco, featuring neon accents, dark background, and bold typography..."></textarea>
<!-- AI Suggestion Chips -->
<div class="absolute bottom-sm left-sm flex gap-2">
<span class="px-3 py-1 bg-primary-container/20 border border-primary-container/30 rounded-full font-label-sm text-label-sm text-primary-fixed-dim">Corporate</span>
<span class="px-3 py-1 bg-primary-container/20 border border-primary-container/30 rounded-full font-label-sm text-label-sm text-primary-fixed-dim">Event</span>
</div>
</div>
</div>
<div class="flex justify-end">
<button class="px-6 py-3 rounded-lg font-label-sm text-label-sm text-surface-container-lowest bg-gradient-to-r from-primary-container to-[#10b981] hover:opacity-90 transition-opacity flex items-center gap-2 shadow-lg shadow-primary-container/20">
                        Generate
                        <span class="material-symbols-outlined text-[18px]">arrow_forward</span>
</button>
</div>
</div>
<!-- Style Presets (Spans 4 cols) -->
<div class="lg:col-span-4 glass-panel rounded-xl p-md flex flex-col">
<h3 class="font-headline-sm text-headline-sm text-on-surface mb-md">Style Presets</h3>
<div class="grid grid-cols-2 gap-sm flex-grow">
<button class="relative rounded-lg overflow-hidden group border border-outline-variant hover:border-primary-container transition-colors">
<img alt="Minimalist preset" class="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity" data-alt="clean minimalist architectural layout with stark white background and sharp shadows" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCWxpBwy12-Iu9f-Rhqx76BTWNFPTIjmlPntlX91U_x_kuLgRIGmaR1HAtYtwBdhdDpdGA34yZvHcGnNgGnLE61aAuZ9ayFyoXF6ETRgjknIY3T-1uXQHQvBOiK9u2LYV6IjMufQGc6WXHIYgOLE8dbEVpwnMxdJBlMpwihwSYQBQhc5var6vcKrY1QG-gXJo4TyLtWM1NiNyEI-oBvxjtURhOuh3Dv3Mh0r7UcckzPieCAdtekEcdHZaxvXOOMDSDtw2FEUW4-jEYa"/>
<div class="absolute inset-0 flex items-center justify-center bg-black/40">
<span class="font-label-sm text-label-sm text-white">Minimalist</span>
</div>
</button>
<button class="relative rounded-lg overflow-hidden group border border-primary-container transition-colors">
<img alt="Vibrant preset" class="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity" data-alt="vibrant abstract digital art with glowing neon colors blending organically" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAUzk28E0E8pK-uWVK8KWOC4QBxYqMdq44F30AdgEZs6ozb3JJkiHn847Ag2oalNBDZ1EiagSeGh-mQ-C1C6dFbfApHOfx6fC5NesNOMBkPI7lO1_tKx1Si68JM-vF7rIAHKEUs4IQS3vF1yKa6-EHXoGHp0Go-fVQ2LX8He83lizPqzCNUL1gU99ikrXgzvwmUZQ1QTZ3oiZgnZsduUKKX8yO_M2FtIHFFemmWRX4VvLopG16wQLNWLHUn86xIUmwhTNTkfGoYCTqh"/>
<div class="absolute inset-0 flex items-center justify-center bg-black/40">
<span class="font-label-sm text-label-sm text-white">Vibrant</span>
</div>
<!-- Active indicator -->
<div class="absolute top-2 right-2 w-2 h-2 rounded-full bg-primary-container shadow-[0_0_8px_rgba(124,58,237,0.8)]"></div>
</button>
<button class="relative rounded-lg overflow-hidden group border border-outline-variant hover:border-primary-container transition-colors">
<img alt="Corporate preset" class="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity" data-alt="modern glass office building reflecting blue sky indicating a corporate professional setting" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBIqHfs2eaB0E_tKYwrm6kUtXww-R41yqO15fKzjQzz6qNEejXe55XJU5PSaXJNuaX1I3b-LiTYchL02BgbLF5XqUBc1zX9FSyWguL7UUPc6e6koJwvAZNB9HK3thfTIhDNNculZ1hNn0SdWV31vPzDGn_ZspZ4zzGgxcR8zlhHSMgecwCUb2AOje1fyH3SOq5BQs4psohifuYfVeeQnRqomjegwCTXj1iXCWf9fkjcWkHMlXmwyYwN58SWRpONfJhWpdrPiR5L0IIL"/>
<div class="absolute inset-0 flex items-center justify-center bg-black/40">
<span class="font-label-sm text-label-sm text-white">Corporate</span>
</div>
</button>
<button class="relative rounded-lg overflow-hidden group border border-outline-variant hover:border-primary-container transition-colors">
<img alt="Artistic preset" class="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity" data-alt="textured abstract painting with bold brush strokes and contrasting rich colors" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBmpEejxA_gQp8C8x2w1VvnLw92p1W4RBMxLBH8VqKehzChuxAWKrluGP4uMJNzgGtn609nAvI_u-j5RodE077hMQlCGvl-n_5Lj0dBYTBxfn1e8ift6RRHFCAHD7Nqxjn_iM0qgjtKdfDY9zQ8eQavVM728mzSnRb4Hc4Tc8WLrYxvf_4xCEL3C0pVOCqp311Vt79T5rvqjIoC9qr4oGcVeB3MrATKtirkQ2NrN_iF-gMCwWKYaWcaJa1UIxNllbf_7Mqr3iFVIIL9"/>
<div class="absolute inset-0 flex items-center justify-center bg-black/40">
<span class="font-label-sm text-label-sm text-white">Artistic</span>
</div>
</button>
</div>
</div>
</div>
<!-- Recent Generations -->
<div>
<div class="flex items-center justify-between mb-md">
<h3 class="font-headline-sm text-headline-sm text-on-surface">Recent Generations</h3>
<a class="font-label-sm text-label-sm text-tertiary-fixed-dim hover:text-tertiary transition-colors" href="#">View All</a>
</div>
<div class="grid grid-cols-2 md:grid-cols-4 gap-md">
<!-- Gallery Item 1 -->
<div class="glass-panel rounded-xl overflow-hidden group cursor-pointer">
<div class="relative aspect-[3/4]">
<img alt="Tech Expo Flyer" class="w-full h-full object-cover" data-alt="modern flyer design for a tech expo featuring bold typography and futuristic elements" src="https://lh3.googleusercontent.com/aida-public/AB6AXuC_s7HzBe_dDZTFTVC71oZqYTLng-lt8eSPvVyyxExoPwsAXxCJZYu5klttu5lHa3ZUEcpf2v8eOhC8Ef6qRHWFiGxNdKngvUZQgb7X3-GehKkf2VqmA9nQzIDf3REZ7KV9ozHZqAYfCgzKhbjBTlbqHcv4iO9mQMVUDPlmu5ep1gz2KP6OvpmHf0AjUR5Uxupnjz7u1tK8dWRdd5p-KMyK5heq-q5jr3Y_3IQOQF924efzZ6gLXkb3wX9RPe2lMncNqX_uoUunzmHJ"/>
<div class="absolute inset-0 bg-surface-container-highest/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
<button class="px-4 py-2 bg-primary-container text-white rounded-lg font-label-sm text-label-sm">Edit</button>
</div>
</div>
<div class="p-sm">
<div class="font-label-sm text-label-sm text-on-surface truncate">Tech Expo 2024</div>
<div class="text-[10px] text-on-surface-variant">2 hours ago</div>
</div>
</div>
<!-- Gallery Item 2 -->
<div class="glass-panel rounded-xl overflow-hidden group cursor-pointer">
<div class="relative aspect-[3/4]">
<img alt="Music Festival Flyer" class="w-full h-full object-cover" data-alt="vibrant music festival flyer design with crowd silhouette and neon lighting effects" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBLWCEm74fCPCHp1Cmwhm2CRwF-hH5Z0YYJNWbPaYQEMawNAxDEkcqv7PcgkCNvxzHQ3Fpj3-v2tN3XSHsCIVTlkzZMIJGd9Ak5dEh4AFfl6uy-aKry9w4yDN_Qtr8ofpCHPxCIRwWjVVAq6suCjMPNOlbwUsuC1905CK7oRII7Z7JN_zdluYDNIVJeG2qkHav_MLERlWQXk8VpFiOR9GD-YLWnIRxaKTO7CJwPsrBKoEBypg5UoteGuMx4I49wssqxuwTRejfE_J9Q"/>
<div class="absolute inset-0 bg-surface-container-highest/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
<button class="px-4 py-2 bg-primary-container text-white rounded-lg font-label-sm text-label-sm">Edit</button>
</div>
</div>
<div class="p-sm">
<div class="font-label-sm text-label-sm text-on-surface truncate">Summer Fest</div>
<div class="text-[10px] text-on-surface-variant">Yesterday</div>
</div>
</div>
<!-- Gallery Item 3 -->
<div class="glass-panel rounded-xl overflow-hidden group cursor-pointer">
<div class="relative aspect-[3/4]">
<img alt="Restaurant Promo Flyer" class="w-full h-full object-cover" data-alt="elegant restaurant promotional flyer featuring gourmet food and sophisticated dark styling" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCjOhYB6BQNnyNBr2DImK-lNHs99X2JTn2gz9jsIWsHX_-wIgqP6E4znrxRWHezqRrGjebZUkSgf9xFaguQC4Hx6nwpJ0kaHGJUPqsRmsurcJNArIj5R4kfwKiPpDJNmpIDo56ubqnfvYef2pcQ08Zg4x_czNIwPwp4pxyocJ3vUG99KTs3BKGI-xbrqfxNDkvLbaa_wvT8kq-U98jMVKBT4m6oMKdwi_yN7lIPthXRnK4rnztXaf9Itd8VwrG2UuvdO4KzOKU0kgID"/>
<div class="absolute inset-0 bg-surface-container-highest/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
<button class="px-4 py-2 bg-primary-container text-white rounded-lg font-label-sm text-label-sm">Edit</button>
</div>
</div>
<div class="p-sm">
<div class="font-label-sm text-label-sm text-on-surface truncate">Grand Opening</div>
<div class="text-[10px] text-on-surface-variant">3 days ago</div>
</div>
</div>
<!-- Gallery Item 4 -->
<div class="glass-panel rounded-xl overflow-hidden group cursor-pointer">
<div class="relative aspect-[3/4] bg-surface-container-low flex items-center justify-center">
<div class="text-center p-4">
<span class="material-symbols-outlined text-[32px] text-on-surface-variant mb-2">add_photo_alternate</span>
<div class="font-label-sm text-label-sm text-on-surface-variant">More in Gallery</div>
</div>
</div>
</div>
</div>
</div>
</main>
<!-- BottomNavBar (Mobile) -->
<nav class="fixed bottom-0 w-full z-50 md:hidden flex justify-around items-center h-20 pb-safe px-6 bg-slate-950/80 backdrop-blur-2xl text-[10px] uppercase tracking-widest font-bold docked full-width bottom-0 rounded-t-2xl border-t-transparent shadow-[0_-10px_20px_rgba(0,0,0,0.5)]">
<a class="flex flex-col items-center justify-center text-emerald-400 bg-violet-500/10 rounded-xl p-2 hover:text-violet-400 transition-colors" href="#">
<span class="material-symbols-outlined mb-1">dashboard</span>
            Dashboard
        </a>
<a class="flex flex-col items-center justify-center text-slate-500 p-2 hover:text-violet-400 transition-colors" href="#">
<span class="material-symbols-outlined mb-1">auto_awesome</span>
            Generate
        </a>
<a class="flex flex-col items-center justify-center text-slate-500 p-2 hover:text-violet-400 transition-colors" href="#">
<span class="material-symbols-outlined mb-1">collections</span>
            Gallery
        </a>
<a class="flex flex-col items-center justify-center text-slate-500 p-2 hover:text-violet-400 transition-colors" href="#">
<span class="material-symbols-outlined mb-1">settings</span>
            Settings
        </a>
</nav>
</body></html>
