# Feature Implementation Status

## ✅ Implemented Features

### Backend
- ✅ JWT auth with access tokens (Basic)
- ✅ User model (name, email, password)
- ✅ Board model (title, owner, members)
- ✅ List model (title, order, boardId)
- ✅ Card model (title, description, order, listId, creator, dueDate)
- ✅ Owner/Member concept (basic invite flow exists)
- ✅ CRUD APIs for boards/lists/cards
- ✅ Invite member to board endpoint
- ✅ Move/reorder cards endpoint (supports drag-drop)

### Frontend
- ✅ Board screen with lists and cards
- ✅ Drag & drop for cards (using @dnd-kit)
- ✅ Move cards between lists
- ✅ Reorder cards within lists
- ✅ Basic loading states
- ✅ Login/Register pages
- ✅ Dashboard with boards

---

## ❌ Missing Features

### Backend
- ❌ **Refresh tokens** (only access tokens implemented)
- ❌ **Labels array** on cards (structure exists but not used)
- ❌ **Filter cards by label and due date range**
- ❌ **Audit log storage** (model exists but not used)
- ❌ **Audit log endpoint** (paginated)
- ❌ **List reordering endpoint** (only card reorder works)

### Frontend
- ❌ **Invite member modal UI**
- ❌ **Audit log view**
- ❌ **Label management UI**
- ❌ **Due date picker**
- ❌ **Card filtering UI**
- ❌ **Comprehensive error handling**
- ❌ **Optimistic UI updates**

---

## ⚠️ Partial Implementation

- ⚠️ Role-based access (basic owner/member but no permission checks)
- ⚠️ Card details (structure exists but minimal UI)
- ⚠️ Error states (basic but not comprehensive)

---

## Priority Implementation Order

1. **Audit Log System** (Backend + Frontend)
2. **Refresh Tokens**
3. **Card Filtering** (labels + due dates)
4. **Invite Member Modal**
5. **Better Error Handling**
6. **Optimistic UI Updates**
