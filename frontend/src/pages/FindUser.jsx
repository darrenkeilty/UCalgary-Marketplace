// FindUser.jsx
import { useEffect, useState } from "react";
import {
  Box,
  Container,
  Divider,
  Stack,
  TextField,
  Typography,
  InputAdornment,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import ProfileIcon from "../assets/ProfileIconSVG";
import CustomButton from "../components/CustomButton";
import DesktopNav from "../components/DesktopNav";
import MobileNav from "../components/MobileNav";
import Header from "../components/Header";

export default function FindUser() {
  const [searchTermUser, setSearchTermUser] = useState("");
  const [users, setUsers] = useState([]);

const page_size = 6;

useEffect(() => {
  async function fetchUsers() {
    try {
      const searchTerm = searchTermUser.trim();

      const queryParams = new URLSearchParams({
        limit: page_size.toString(),
        offset: "0",
      });

      if (searchTerm !== "") {
        queryParams.append("q", searchTerm);
      }

      const res = await fetch(
        `http://localhost:8080/api/admin/users?${queryParams.toString()}`
      );

      const data = await res.json();

      const mapped = (data.users || []).map((u) => ({
        id: u.user_id,
        name: `${u.fname} ${u.lname}`.trim(),
        email: u.email,
      }));

      setUsers(mapped);
    } catch (err) {
      console.error("There was a failure to fetch users:", err);
      setUsers([]);
    }
  }

  fetchUsers();
}, [searchTermUser]);

  // Filter the users based on search term
  const filterUsers = users.filter((user) => {
    const searchTerm = searchTermUser.toLowerCase().trim();
    return (
      !searchTerm ||
      user.name.toLowerCase().includes(searchTerm) ||
      user.email.toLowerCase().includes(searchTerm)
    );
  });

  const handleViewUser = (id) => {
    // TODO: navigate to view user
    console.log("View user", id);
  };

  const handleDeleteUser = (id) => {
    // TODO: call backend delete 
    console.log("Delete user", id);
  };

  return (
    <Stack
      direction="row"
      sx={{ bgcolor: "background.paper", minHeight: "100vh" }}
    >
      {/* Desktop nav */}
      <Box sx={{ display: { xs: "none", md: "block" } }}>
        <DesktopNav />
      </Box>

      {/* Header and Content*/}
      <Box sx={{ flex: 1, m: 0 }}>
        <Header />

        <Container
          maxWidth="lg"
          sx={{
            flexGrow: 1,
            py: { xs: 2, md: 4 },
            px: { xs: 2, sm: 3, md: 6 },
            display: "flex",
            flexDirection: "column",
            gap: { xs: 2, md: 3 },
            mb: { xs: 10, md: 4 },
          }}
        >
          {/*  Title */}
          <Box>
              <Typography variant="h4" sx={{
                  mb: 2,
                  fontSize: {
                      xs: "24px",  
                      sm: "28px",  
                      md: "32px", 
                  },
                  fontWeight: 400,
              }}>
              Find User
            </Typography>
          </Box>

          {/* Search bar */}
          <TextField
            fullWidth
            variant="standard"
            placeholder="Search…"
            value={searchTermUser}
            onChange={(e) => setSearchTermUser(e.target.value)}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />

          <Divider sx={{ my: 3 }} />

          {/* Grid for User Cards */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                md: "repeat(2, minmax(0, 1fr))",
              },
              gap: 3,
            }}
          >
            {filterUsers.map((user) => (
              <UserCard
                key={user.id}
                user={user}
                onView={() => handleViewUser(user.id)}
                onDelete={() => handleDeleteUser(user.id)}
              />
            ))}
          </Box>
        </Container>
      </Box>

      {/* Mobile nav */}
      <Box
        sx={{
          display: { xs: "block", md: "none" },
          position: "fixed",
        }}
      >
        <MobileNav />
      </Box>
    </Stack>
  );
}

// User Card
function UserCard({ user, onView, onDelete }) {
  return (
    <Box
      sx={(theme) => ({
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 3,
        p: 3,
        alignItems: "center",
        display: "flex",
        gap: 2,
        backgroundColor: "#FFFFFF",
      })}
    >
      {/* Profile Icon Circle */}
      <Box
        sx={{
          width: 90,
          height: 90,
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <ProfileIcon width={49} height={49} />
      </Box>

      {/* Name, email and custom buttons */}
      <Box sx={{ flex: 1 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
          {user.name}
        </Typography>
        <Typography
          variant="body2"
          sx={{ color: "text.secondary", mb: 1, mt: 0.5 }}
        >
          {user.email}
        </Typography>

        <Stack direction="row" spacing={1.5}>
          <CustomButton
            variant="contained"
            size="small"
            onClick={onView}
            sx={{
              textTransform: "none",
              backgroundColor: "#000000",
            }}
          >
            View
          </CustomButton>

          <CustomButton
            variant="contained"
            size="small"
            onClick={onDelete}
            sx={{
              textTransform: "none",
              backgroundColor: "#D22C22",
            }}
          >
            Delete User
          </CustomButton>
        </Stack>
      </Box>
    </Box>
  );
}
