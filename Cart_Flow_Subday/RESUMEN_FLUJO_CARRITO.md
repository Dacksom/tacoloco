# Flujo del Carrito (Cart Flow) - Subday

Esta carpeta contiene todos los componentes, utilidades y tipos relacionados con el flujo de construcción del carrito de compras y checkout extraídos del proyecto **Subday**, listos para que los adaptes a tu nuevo proyecto (como TacoLoco o similar).

## Archivos Incluidos y sus Funciones:

1. **`App.tsx`**
   - Es el "cerebro" donde reside el estado del carrito (`cart`, `setCart`).
   - Contiene la lógica `addToCart`, `removeFromCart` y `handleConfirmOrder` (que se conecta con la base de datos atómica).
   - Gestiona las vistas (`currentView`) cambiando entre `BUILDER`, `CART` (lateral) y `CHECKOUT`.

2. **`components/Cart.tsx`**
   - El componente visual del carrito lateral (Offcanvas/Bottom sheet).
   - Muestra los productos añadidos, las opciones para agregar bebidas ("¡Pídete algo más!"), permite duplicar un producto para otra persona y actualizar las cantidades de los productos adicionales (tipo OTHER).

3. **`components/Checkout.tsx`**
   - Contiene toda la lógica final del pedido: recolección de datos del cliente, cálculo del Delivery (DeliveryCalculator.tsx), opciones de pago (Zelle, Efectivo, Pago Móvil), propinas y el resumen total.
   - Genera el mensaje de WhatsApp.

4. **`components/SubBuilder.tsx` y `MenuDisplay.tsx`**
   - Los archivos por donde empieza el flujo del usuario. Construyen el ítem y lo pasan a la App para registrarlo en el carrito.

5. **`components/header.tsx`**
   - Incluye el botón con el ícono del carrito para abrir la vista del carrito.

6. **`types.ts` y `constants.ts`**
   - Incluyen interfaces clave como `CustomizedSub`, `Order` y las constantes necesarias para iterar a lo largo del menú.

7. **`services/api.ts`** y **`lib/supabase.ts`**
   - Proveen las funciones necesarias para conectarse a Supabase e insertar o cargar las órdenes.

## Cómo Adaptarlo:
- Si tu nuevo proyecto no utiliza el formato "constructor" (SubBuilder), simplemente omite este paso y alimenta el estado `cart` en el componente padre directamente con los ítems (ej. Tacos) a través de un botón "Agregar".
- Reutiliza la estética y las transiciones (con *framer-motion*) de `Cart.tsx` y `Checkout.tsx`. En especial las variables de CSS en Tailwind y las animaciones que le dan ese diseño moderno (glassmorphism/neumorphism).
- Puedes reemplazar los tipos de producto (`SANDWICH`, `PIZZA`, etc.) por tu propia estructura si es para tacos u otro tipo de comida.
