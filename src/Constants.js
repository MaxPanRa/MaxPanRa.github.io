export const CLIENT_GUID='561326193392-71u84huibkpfu36g6hfmfdlnc5hg781v.apps.googleusercontent.com';
//export const CLIENT_GUID='jcxxgpnztjRVjCvjCMkk';
export const LOOKER_WEB= "https://gtechdev.cloud.looker.com/";

export const REDIRECT_URI='https://maxpanra.github.io/'
//export const REDIRECT_URI='https://localhost:3000/';

export const SLUG_QUERY="SELECT vm_forecast_dash.PRODUCTOID AS vm_forecast_dash_id, cp.tipo as vm_forecast_dash_type, cp.arca as vm_forecast_dash_arca, vm_forecast_dash.row_num  AS vm_forecast_dash_row_num, vm_forecast_dash.PRODUCTO  AS vm_forecast_dash_producto, vm_forecast_dash.CAPACIDAD_CONFIGURADA  AS vm_forecast_dash_capacidad_configurada, vm_forecast_dash.VENDIDO  AS vm_forecast_dash_vendido, vm_forecast_dash.VAL_VENDIDO  AS vm_forecast_dash_val_vendido, vm_forecast_dash.obs_cliente  AS vm_forecast_dash_obs_cliente, vm_forecast_dash.forecast_arca  AS vm_forecast_dash_forecast_arca, vm_forecast_dash.obs_gral  AS vm_forecast_dash_obs_gral, COALESCE(CAST(SUM(vm_forecast_dash.VAL_VENDIDO ) AS FLOAT), 0) AS vm_forecast_dash_total_val_vendido FROM [arca-vm-analytics:poc_vm_data.vm_forecast_dash]  AS vm_forecast_dash JOIN cat_productos AS cp ON vm_forecast_dash.PRODUCTOID = cp.PRODUCTOID WHERE ((( vm_forecast_dash.fecha_visita  ) >= (TIMESTAMP('2023-11-20')) AND ( vm_forecast_dash.fecha_visita  ) < (TIMESTAMP('2023-12-20')))) GROUP BY 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11 ORDER BY 1";

export const ALLFILTERS=["bebida","botana","panaderia","dulceria"]