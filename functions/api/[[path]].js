import '../_lib/routes.js';
import '../_lib/admin.js';
import { dispatch } from '../_lib/router.js';

export const onRequest = (context) => dispatch(context);
