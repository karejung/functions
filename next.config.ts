import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === 'production';

const nextConfig: NextConfig = {
  // 프로덕션 빌드일 때만 basePath 적용
  ...(isProd && {
    basePath: "/functions",
    assetPrefix: "/functions",
  }),
  output: "export",
  images: {
    unoptimized: true,
  },
  webpack: (config) => {
    // GLSL 셰이더 파일을 문자열로 import 가능하게 설정
    config.module.rules.push({
      test: /\.glsl$/,
      use: 'raw-loader',
    });

    return config;
  },
};

export default nextConfig;
