import { NextResponse } from 'next/server';

/**
 * Clean adapter to run standard Node/Vercel serverless (req, res) handlers
 * inside Next.js App Router Route Handlers.
 */
export function createRouteHandler(handler) {
  const handlerFn = async (request, context = {}) => {
    const url = new URL(request.url);
    const query = Object.fromEntries(url.searchParams.entries());

    // Merge route params (e.g. { dayNumber: '1' } or { id: '...' })
    if (context?.params) {
      const resolvedParams = await Promise.resolve(context.params);
      Object.assign(query, resolvedParams);
    }

    let body = {};
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)) {
      try {
        const text = await request.text();
        if (text) {
          body = JSON.parse(text);
        }
      } catch (e) {
        body = {};
      }
    }

    const headersObj = {};
    request.headers.forEach((value, key) => {
      headersObj[key.toLowerCase()] = value;
    });

    const cookieHeader = request.headers.get('cookie') || '';
    const cookiesObj = {};
    cookieHeader.split(';').forEach((cookieStr) => {
      const parts = cookieStr.trim().split('=');
      if (parts[0]) {
        cookiesObj[parts[0]] = parts.slice(1).join('=');
      }
    });

    let statusCode = 200;
    let responseBody = null;
    const responseHeaders = new Headers();

    const req = {
      method: request.method,
      url: request.url,
      query,
      body,
      headers: headersObj,
      cookies: cookiesObj,
    };

    const res = {
      statusCode: 200,
      headersSent: false,
      status(code) {
        statusCode = code;
        this.statusCode = code;
        return res;
      },
      json(data) {
        this.headersSent = true;
        responseBody = data;
        return res;
      },
      send(data) {
        this.headersSent = true;
        responseBody = data;
        return res;
      },
      setHeader(name, value) {
        if (name.toLowerCase() === 'set-cookie') {
          responseHeaders.append('Set-Cookie', value);
        } else {
          responseHeaders.set(name, value);
        }
        return res;
      },
      getHeader(name) {
        return responseHeaders.get(name);
      },
      end() {
        this.headersSent = true;
        return res;
      },
    };

    try {
      await handler(req, res);
      return NextResponse.json(responseBody ?? {}, {
        status: statusCode,
        headers: responseHeaders,
      });
    } catch (err) {
      console.error(`[API Error] ${request.method} ${request.url}:`, err);
      return NextResponse.json(
        { error: err.message || 'Internal Server Error' },
        { status: 500 }
      );
    }
  };

  return {
    GET: handlerFn,
    POST: handlerFn,
    PUT: handlerFn,
    DELETE: handlerFn,
    PATCH: handlerFn,
    OPTIONS: handlerFn,
  };
}
