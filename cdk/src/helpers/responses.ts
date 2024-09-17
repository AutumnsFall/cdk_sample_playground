import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import 'tsconfig-paths/register';
import config from 'config.json';

function getOrigin(event: APIGatewayProxyEvent) {
    const originKey = Object.keys(event.headers || {}).find((key) => /origin/i.test(key));
    let origin = 'https://localhost:8443';
    if (originKey && event.headers[originKey]) {
        origin = event.headers[originKey]!;
    }
    return origin;
}

function getOriginLimitedHeaders(origin: string) {
    const headers: { [key: string]: string } = {
        'Content-type': 'application/json; charset=utf-8',
        'Cache-Control': 'private, no-store, no-cache, must-revalidate',
    };
    if (config.allowedOrigins.includes(origin)) {
        headers['Access-Control-Allow-Origin'] = origin;
    }

    return headers;
}

function getResponse(statusCode: number, body: string, origin?: string): APIGatewayProxyResult {
    if (origin) {
        return {
            statusCode,
            headers: getOriginLimitedHeaders(origin),
            body,
        };
    }
    return {
        statusCode,
        headers: {
            'Content-type': 'application/json; charset=utf-8',
            'Cache-Control': 'private, no-store, no-cache, must-revalidate',
            'Access-Control-Allow-Origin': '*',
        },
        body,
    };
}

function getErrorResponse(error: Error, origin?: string): APIGatewayProxyResult {
    return getResponse(500, JSON.stringify(error.message), origin);
}

function getNotFoundResponse(origin?: string): APIGatewayProxyResult {
    return getResponse(404, JSON.stringify({ message: 'Resource Not Found.' }), origin);
}

function getValidationErrorResponse(errors: Error, origin?: string): APIGatewayProxyResult {
    return getResponse(400, JSON.stringify({ errors }), origin);
}

function getSuccessResponse(body: string, origin?: string): APIGatewayProxyResult {
    return getResponse(200, body, origin);
}

export default {
    getSuccessResponse,
    getOrigin,
    getValidationErrorResponse,
    getNotFoundResponse,
    getErrorResponse,
};
