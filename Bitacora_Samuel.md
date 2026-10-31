Bitácora de Desarrollo - Proyecto "Signal" (Milestone 1)
Este documento registra el proceso de desarrollo, las decisiones técnicas, la implementación de características y las sesiones de apoyo asistido para la culminación del primer hito del proyecto Signal.

1. Información General del Proyecto
Nombre de la Aplicación: Signal (Red Social)

Pila Tecnológica (Tech Stack): React, TypeScript, Firebase (Firestore, Authentication), Bootstrap 5.3.

Estrategia de Estilos: Implementación nativa de Modo Oscuro global mediante data-bs-theme="dark" de Bootstrap 5.3, complementado con tarjetas interactivas y componentes adaptados (hover effects, contadores personalizados y tipografías claras).

Convenciones de Código:

Lógica interna, variables, funciones, estados y servicios estructurados estrictamente en inglés.

Textos visibles de la interfaz de usuario (UI) en español para una óptima experiencia del usuario local.

2. Fases de Desarrollo y Registro de Issues
Fase 1: Configuración de Base, Autenticación y Enrutamiento
Objetivo: Establecer la arquitectura base de la SPA (Single Page Application) y conectar la autenticación de usuarios con Firebase.

Acciones Realizadas:

Configuración del enrutamiento centralizado con React Router (BaseRouter.tsx).

Implementación de los flujos de inicio de sesión (LoginPage) y registro de cuentas (RegisterPage).

Modularización de los servicios de conexión a Firebase (firebase/config.ts, firebase/providers.ts).

Fase 2: Módulo de Publicaciones (Feed) y Perfiles
Objetivo: Permitir la creación, visualización y gestión de publicaciones (tweets) asociadas a los perfiles de usuario.

Acciones Realizadas:

Creación de componentes clave como TweetCard.tsx para el renderizado estructurado de los mensajes y marcas de tiempo con Firebase Timestamps.

Desarrollo de las vistas de perfil (ProfilePage) integrando contadores dinámicos de publicaciones, seguidores y seguidos.

Fase 3: Lógica de Interacción Social (Follow/Unfollow)
Objetivo: Permitir a los usuarios seguir y dejar de seguir a otros miembros de la red, actualizando dinámicamente las listas y los feeds personalizados.

Acciones Realizadas:

Modularización de las acciones de seguimiento en followingActions.ts y servicios asociados (followers.ts, following.ts).

Actualización de las reglas de seguridad en Firestore para validar de forma segura las relaciones de lectura y escritura entre usuarios.

Creación de las vistas FollowersPage, FollowingPage y UsersPage para la exploración de la red.

Fase 4: Estilos y Modo Oscuro Global (UI/UX)
Objetivo: Pulir la interfaz visual aplicando un diseño moderno basado en el modo oscuro oficial de Bootstrap 5.3.

Acciones Realizadas:

Integración del atributo global data-bs-theme="dark" en el componente raíz (SignalApp.tsx).

Refactorización de tarjetas, listados y contadores (TweetCard, estadísticas de perfiles, vistas de usuarios y listas de seguidores) utilizando paletas oscuras (bg-dark, text-light, border-secondary).

Implementación de efectos interactivos con estado (useState) en las tarjetas de publicaciones para brindar una respuesta visual fluida al pasar el cursor (efecto hover).

3. Conclusiones y Estado del Milestone 1
El proyecto cumple de manera íntegra con todos los requerimientos funcionales establecidos: autenticación robusta, arquitectura modular basada en componentes de React con TypeScript, persistencia y control de datos en Firebase, y una interfaz moderna y coherente bajo los estándares de Bootstrap 5.3.

El código fuente se mantiene limpio, bajo el control de versiones mediante ramas de Git (desde feat/follow-logic hasta la rama de estilos style/dark-mode), cumpliendo con la regla de nomenclatura en inglés y la documentación requerida.