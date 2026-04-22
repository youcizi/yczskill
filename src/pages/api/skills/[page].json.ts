import type { APIRoute } from 'astro';
import skillsMaster from '../../../data/skills-master.json';

const PAGE_SIZE = 50;

/**
 * 预生成分页路径
 */
export async function getStaticPaths() {
  const totalPages = Math.ceil(skillsMaster.length / PAGE_SIZE) || 1;
  
  return Array.from({ length: totalPages }, (_, i) => {
    const page = i + 1;
    const start = i * PAGE_SIZE;
    const end = start + PAGE_SIZE;
    
    return {
      params: { page: page.toString() },
      props: { 
        data: skillsMaster.slice(start, end),
        total: skillsMaster.length,
        totalPages 
      }
    };
  });
}

/**
 * GET 响应
 */
export const GET: APIRoute = ({ props }) => {
  return new Response(JSON.stringify({
    status: "success",
    items: props.data || [],
    pagination: {
      total: props.total || 0,
      total_pages: props.totalPages || 1
    }
  }), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  });
}
