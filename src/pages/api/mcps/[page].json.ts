import type { APIRoute } from 'astro';
import mcpsMaster from '../../../data/mcps-master.json';

const PAGE_SIZE = 50;

/**
 * 预生成分页路径
 */
export async function getStaticPaths() {
  const totalPages = Math.ceil(mcpsMaster.length / PAGE_SIZE) || 1;
  
  return Array.from({ length: totalPages }, (_, i) => {
    const page = i + 1;
    const start = i * PAGE_SIZE;
    const end = start + PAGE_SIZE;
    
    return {
      params: { page: page.toString() },
      props: { 
        data: mcpsMaster.slice(start, end),
        total: mcpsMaster.length,
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
    type: "mcp_registry",
    items: props.data.map((m: any) => ({
      ...m,
      driver_type: "mcp"
    })),
    pagination: {
      total: props.total,
      total_pages: props.totalPages
    }
  }), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  });
}
